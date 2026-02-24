import { NotFoundError, PaginationQueryDto } from '@app/application';
import {
  PaginatedResponse,
  paginatePrisma,
} from '@app/application/common/pagination.util';
import { TransactionsService } from '@app/application/transaction/services/transactions.service';
import { DateService } from '@app/date';
import type { Account } from '@app/domain';
import {
  AccountStatus,
  DebitCredit,
  JournalEntryTarget,
  LEDGER_ACCOUNT_CODES,
  LoanStatus,
  SubscriptionFeeStatus,
  TransactionKind,
  TransactionStatus,
} from '@app/domain';
import type {
  CreateAccountInput,
  ListAccountQueryInput,
  UpdateAccountInput,
} from '@app/domain/bank/types/account.type';
import {
  PrismaAccountRepository,
  PrismaAccountTypeRepository,
  PrismaBankRepository,
  PrismaLoanRepository,
  PrismaSubscriptionFeeRepository,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JournalBalanceUsecase } from './../../ledger/journal-balance.usecase';
import { BankFinancialsService } from './bank-financials.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly accountTypesRepo: PrismaAccountTypeRepository,
    private readonly bankRepo: PrismaBankRepository,
    private readonly subscriptionFeesRepo: PrismaSubscriptionFeeRepository,
    private readonly transactionalRepo: PrismaTransactionalRepository,
    private readonly journalBalanceUsecase: JournalBalanceUsecase,
    private readonly loansRepo: PrismaLoanRepository,
    private readonly bankFinancialsService: BankFinancialsService,
    private readonly transactionsService: TransactionsService,
    private readonly dateService: DateService,
  ) {}

  async findAll(
    query?: ListAccountQueryInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginatedResponse<Account>> {
    if (tx) {
      const where: Prisma.AccountWhereInput = {};

      if (query?.userId) {
        where.userId = query.userId;
      }

      if (query?.accountTypeId) {
        where.accountTypeId = query.accountTypeId;
      }

      if (query?.status) {
        where.status = query.status;
      }

      if (query?.isDeleted !== undefined) {
        where.isDeleted = query.isDeleted;
      }

      const page = await paginatePrisma<
        Account,
        Prisma.AccountFindManyArgs,
        Prisma.AccountWhereInput
      >({
        repo: this.accountsRepo,
        where,
        query: query ?? new PaginationQueryDto(),
        searchFields: ['name', 'cardNumber', 'bankName'],
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        tx,
        include: {
          accountType: true,
          user: { include: { identity: { select: { name: true } } } },
        },
      });

      // Attach balanceSummary to each account (parallelized)
      const itemsWithBalances = await Promise.all(
        page.items.map(async (acct) => {
          try {
            const balance = await this.journalBalanceUsecase.getAccountBalance(
              acct.id,
              tx,
            );
            acct.balanceSummary = balance;
          } catch {
            acct.balanceSummary = undefined;
          }
          return acct;
        }),
      );

      return { ...page, items: itemsWithBalances };
    }

    return this.transactionalRepo.withTransaction((t) =>
      this.findAll(query, t),
    );
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Account> {
    if (tx) {
      const account = await this.accountsRepo.findUnique(
        {
          where: { isDeleted: false, id },
          include: { accountType: true, user: { include: { identity: true } } },
        },
        tx,
      );
      if (!account) {
        throw new NotFoundError('Account', 'id', id);
      }
      const balance = await this.journalBalanceUsecase.getAccountBalance(
        id,
        tx,
      );
      account.balanceSummary = balance;
      return account;
    }

    return this.transactionalRepo.withTransaction((t) => this.findById(id, t));
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]> {
    if (tx) return this.accountsRepo.findByUserId(userId, tx);
    return this.transactionalRepo.withTransaction((t) =>
      this.findByUserId(userId, t),
    );
  }

  async create(
    input: CreateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    await this.validateAccountType(input.accountTypeId);

    await this.checkAccountTypeMaxAccounts(input.accountTypeId, tx);

    await this.isCardUnique(input);

    const payload: CreateAccountInput & { name: string } = {
      ...input,
      name: this.generateName(input),
    };
    const run = async (DBtx: Prisma.TransactionClient) => {
      const created = await this.accountsRepo.create(payload, DBtx);

      const bank = await this.bankRepo.findOne(DBtx);
      if (bank && bank.subscriptionFee) {
        const baseAmount = bank.subscriptionFee;
        const accountCreationDate = created.createdAt
          ? new Date(created.createdAt)
          : new Date();
        // Get the first day of the next month
        const firstFeeDate = this.dateService.startOfMonth(
          this.dateService.addMonths(accountCreationDate, 1),
        );
        // Create 6 months of subscription fees starting from next month
        for (let i = 0; i < 6; i++) {
          const periodStart = this.dateService.addMonths(firstFeeDate, i);
          await this.subscriptionFeesRepo.create(
            {
              accountId: created.id,
              periodStart,
              amount: baseAmount,
              status: SubscriptionFeeStatus.DUE,
            },
            DBtx,
          );
        }
      }

      return created;
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  async update(
    id: string,
    account: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    if (tx) {
      const exists = await this.accountsRepo.findUnique({ where: { id } }, tx);
      if (!exists) {
        throw new NotFoundError('Account', 'id', id);
      }
      try {
        return await this.accountsRepo.update(id, account, tx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('Account', 'id', id);
        }
        throw e;
      }
    }

    return this.transactionalRepo.withTransaction((t) =>
      this.update(id, account, t),
    );
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (tx) {
      const exists = await this.accountsRepo.findUnique({ where: { id } }, tx);
      if (!exists) {
        throw new NotFoundError('Account', 'id', id);
      }
      try {
        await this.accountsRepo.softDelete(id, currentUserId, tx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('Account', 'id', id);
        }
        throw e;
      }
      return;
    }

    return this.transactionalRepo.withTransaction((t) =>
      this.softDelete(id, currentUserId, t),
    );
  }

  async buyOut(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // 1. Ensure account exists
      const account = await this.accountsRepo.findUnique(
        { where: { id } },
        DBtx,
      );
      if (!account) throw new NotFoundError('Account', 'id', id);

      // Ensure this account does not already have a withdrawal transaction
      const existingWithdrawal = await this.transactionsService.findAll(
        {
          accountId: account.id,
          kind: TransactionKind.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          isDeleted: false,
        },
        DBtx,
      );

      if (existingWithdrawal.items.length > 0) {
        throw new BadRequestException(
          'حساب کاربری در حال حاضر دارای تراکنش برداشت در انتظار است',
        );
      }

      // 2. Ensure account does not have pending/active/approved loans
      await this.ensureNoBlockingLoans(account.id, DBtx);

      // 3. Compute account balance and buyout amount (do NOT subtract unpaid fees)
      const accountBalance = await this.journalBalanceUsecase.getAccountBalance(
        account.id,
        DBtx,
      );
      const totalDeposits = parseFloat(String(accountBalance.totalDeposits));
      const buyoutAmount = totalDeposits;

      // If there's nothing to pay out, skip creating a transaction but still cleanup and deactivate
      if (buyoutAmount <= 0) {
        // Delete all non-paid subscription fees (due + future), keep only PAID
        await this.subscriptionFeesRepo.softDeleteMany(
          {
            accountId: account.id,
            status: { not: SubscriptionFeeStatus.PAID },
          },
          currentUserId,
          DBtx,
        );

        // Update account status to INACTIVE
        await this.accountsRepo.update(
          account.id,
          { status: AccountStatus.INACTIVE },
          DBtx,
        );

        return;
      }
      // 4. Ensure bank has funds
      const bankCash = await this.bankFinancialsService.getCashBalance(
        undefined,
        DBtx,
      );
      if (parseFloat(bankCash) < buyoutAmount) {
        throw new BadRequestException(
          'Bank does not have enough cash to buy out',
        );
      }

      // 5. Create transaction + journal entries (debit customer deposits, credit cash)
      const txInput = {
        userId: account.userId,
        kind: TransactionKind.WITHDRAWAL,
        amount: buyoutAmount.toFixed(4),
        status: TransactionStatus.ALLOCATED,
        note: 'تسویه حساب و پرداخت مانده به کاربر پس از کسر ماهیانه های پرداخت نشده',
        journalEntries: [
          {
            ledgerAccountCode: LEDGER_ACCOUNT_CODES.CUSTOMER_DEPOSITS,
            amount: buyoutAmount.toFixed(4),
            dc: DebitCredit.DEBIT,
            targetType: JournalEntryTarget.ACCOUNT,
            targetId: account.id,
            accountId: account.id,
          },
          {
            ledgerAccountCode: LEDGER_ACCOUNT_CODES.CASH,
            amount: buyoutAmount.toFixed(4),
            dc: DebitCredit.CREDIT,
          },
        ],
      };

      // 7. Create the transaction
      await this.transactionsService.createSpecificTransaction(txInput, DBtx);

      // 8. Delete all non-paid subscription fees (due + future), keep only PAID
      await this.subscriptionFeesRepo.softDeleteMany(
        { accountId: account.id, status: { not: SubscriptionFeeStatus.PAID } },
        currentUserId,
        DBtx,
      );

      // 10. Update account status to INACTIVE
      await this.accountsRepo.update(
        account.id,
        { status: AccountStatus.INACTIVE },
        DBtx,
      );
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  async activate(id: string, tx?: Prisma.TransactionClient): Promise<Account> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // 1. Ensure account exists
      const account = await this.accountsRepo.findUnique(
        { where: { id } },
        DBtx,
      );
      if (!account) throw new NotFoundError('Account', 'id', id);

      // 2. Restore any subscription fees that were soft-deleted during buyout
      await this.subscriptionFeesRepo.restoreManyByAccountId(id, DBtx);

      // 3. Set account status back to ACTIVE
      return this.accountsRepo.update(
        id,
        { status: AccountStatus.ACTIVE },
        DBtx,
      );
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  private async ensureNoBlockingLoans(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const loans = await this.loansRepo.findAll(
      {
        where: {
          accountId,
          isDeleted: false,
          status: {
            in: [LoanStatus.PENDING, LoanStatus.ACTIVE],
          },
        },
      },
      tx,
    );
    if (loans.length > 0) {
      console.log(loans);
      throw new BadRequestException('Account has pending or active loans');
    }
  }

  private async getUnpaidFeesUpToToday(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const today = new Date();
    const fees = await this.subscriptionFeesRepo.findAll(
      {
        where: {
          accountId,
          periodStart: { lte: today },
          status: { not: SubscriptionFeeStatus.PAID },
        },
      },
      tx,
    );
    const total = fees.reduce(
      (s, f) => s + parseFloat(f.amount as unknown as string),
      0,
    );
    return { unpaidFees: fees, unpaidTotal: total };
  }

  // Checks to see if the card number is unique
  private async isCardUnique(input: CreateAccountInput) {
    const existing = await this.accountsRepo.findUnique({
      where: { cardNumber: input.cardNumber },
    });
    if (existing) {
      throw new BadRequestException('Card number must be unique');
    }
  }

  // Generates a name if not provided
  private generateName(input: CreateAccountInput): string {
    return (
      input.name ?? `${input.bankName.trim()}-${input.cardNumber.slice(-4)}`
    );
  }

  // Validates that the account type exists
  private async validateAccountType(accountTypeId: string) {
    const accountType = await this.accountTypesRepo.findById(accountTypeId);

    if (!accountType) {
      throw new NotFoundError('AccountType', 'id', accountTypeId);
    }
  }

  // Checks if the account type has a max accounts limit and enforces it
  private async checkAccountTypeMaxAccounts(
    accountTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const accountType = await this.accountTypesRepo.findById(accountTypeId, tx);
    if (
      accountType?.maxAccounts !== null &&
      accountType?.maxAccounts !== undefined
    ) {
      const currentCount = await this.accountsRepo.findAll(
        {
          where: { accountTypeId },
        },
        tx,
      );
      if (currentCount.length >= accountType.maxAccounts) {
        throw new BadRequestException(
          `Cannot create more than ${accountType.maxAccounts} accounts for this account type`,
        );
      }
    }
  }
}
