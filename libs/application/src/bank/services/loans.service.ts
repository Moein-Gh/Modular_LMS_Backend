import { AccountsService, NotFoundError } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { TransactionsService } from '@app/application/transaction/services/transactions.service';
import {
  Account,
  AccountStatus,
  CreateTransactionWithJournalEntriesInput,
  DebitCredit,
  InstallmentStatus,
  JournalEntryTarget,
  LEDGER_ACCOUNT_CODES,
  ListLoanQueryInput,
  LoanStatus,
  LoanType,
  Transaction,
  TransactionKind,
  TransactionStatus,
  User,
  UserStatus,
  type CreateLoanInput,
  type Loan,
  type UpdateLoanInput,
} from '@app/domain';

import { JournalBalanceUsecase } from '@app/application/ledger/journal-balance.usecase';
import {
  PrismaAccountRepository,
  PrismaInstallmentRepository,
  PrismaJournalEntryRepository,
  PrismaJournalRepository,
  PrismaLoanRepository,
  PrismaLoanTypeRepository,
  PrismaService,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { BankFinancialsService } from './bank-financials.service';

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepo: PrismaLoanRepository,
    private readonly loanTypeRepo: PrismaLoanTypeRepository,
    private readonly accountRepo: PrismaAccountRepository,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountService: AccountsService,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly installmentRepo: PrismaInstallmentRepository,
    private readonly journalEntriesRepo: PrismaJournalEntryRepository,
    private readonly prismaService: PrismaService,
    private readonly bankFinancialsService: BankFinancialsService,
    private readonly transactionsService: TransactionsService,
    private readonly journalsRepo: PrismaJournalRepository,
    private readonly journalBalanceUseCase: JournalBalanceUsecase,
  ) {}

  async findAll(query?: ListLoanQueryInput, tx?: Prisma.TransactionClient) {
    return paginatePrisma<Loan, Prisma.LoanFindManyArgs, Prisma.LoanWhereInput>(
      {
        repo: this.loansRepo,
        query: query ?? {},
        where: {
          ...(query?.accountId && { accountId: query.accountId }),
          ...(query?.loanTypeId && { loanTypeId: query.loanTypeId }),
          ...(query?.userId && { account: { userId: query.userId } }),
          ...(query?.isDeleted !== undefined && { isDeleted: query.isDeleted }),
        },
        searchFields: ['name'],
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        include: {
          loanType: { select: { id: true, name: true } },
          account: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  identity: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        tx,
      },
    );
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Loan> {
    const loan = await this.loansRepo.findOne(
      {
        where: { id },
        include: {
          loanType: { select: { id: true, name: true } },
          account: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  id: true,
                  identity: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
      tx,
    );
    if (!loan) {
      throw new NotFoundError('Loan', 'id', id);
    }

    const balance = await this.journalBalanceUseCase.getLoanBalance(
      loan.id,
      tx,
    );

    loan.balanceSummary = balance;

    return loan;
  }

  async create(
    input: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // 1. Validate and fetch dependencies
      const loanType = await this.validateLoanTypeId(input.loanTypeId, DBtx);
      const account = await this.validateAccountId(input.accountId, DBtx);

      const user = this.validateActiveUser(account);

      // 2. Perform business rule validations
      this.validateLoanLimits(input, loanType);
      this.validateAccountBalanceForNewLoan(account, input.amount, loanType);
      await this.checkBankFinancialsForNewLoan(input.amount, DBtx);
      await this.checkLoanConflict(input.accountId, DBtx);

      // 3. Create the loan record
      const loan = await this.loansRepo.create(input, DBtx);

      // 4. Calculate financial amounts
      const { commissionAmount, netDisbursement } =
        this.calculateLoanFinancials(
          input.amount,
          loanType.commissionPercentage,
        );

      // 5. Create accounting transaction with journal entries
      await this.createLoanDisbursementTransaction(
        user.id,
        loan.id,
        input.accountId,
        input.amount,
        netDisbursement,
        commissionAmount,
        DBtx,
      );

      // 6. Generate installment schedule
      await this.createInstallmentsForLoan(loan, DBtx);

      return loan;
    };

    const result = tx
      ? run(tx)
      : this.prismaTransactionalRepo.withTransaction(run);
    return result;
  }

  async update(
    id: string,
    loan: UpdateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const exists = await this.loansRepo.findOne({ where: { id } }, tx);
    if (!exists) {
      throw new NotFoundError('Loan', 'id', id);
    }
    try {
      return await this.loansRepo.update(id, loan, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Loan', 'id', id);
      }
      throw e;
    }
  }

  /**
   * Approve a loan by:
   * 1. Validating loan exists and is pending
   * 2. Finding and approving the associated transaction (which posts the journal)
   * 3. Updating loan status to ACTIVE
   * 4. Activating all installments for the loan
   */
  async approve(id: string, tx?: Prisma.TransactionClient): Promise<Loan> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // 1. Fetch and validate loan
      const loan = await this.findById(id, DBtx);
      if (loan.status === LoanStatus.ACTIVE) {
        return loan; // Already approved
      }

      // 2. Find the transaction associated with this loan
      const transaction = await this.findTransactionForLoan(loan.id, DBtx);
      if (!transaction) {
        throw new BadRequestException(
          'No transaction found for this loan. Cannot approve.',
        );
      }

      // 3. Approve the transaction (this also posts the journal automatically)
      await this.transactionsService.approve(transaction.id, DBtx);

      // 4. Update loan status to ACTIVE
      const updatedLoan = await this.loansRepo.update(
        id,
        { status: LoanStatus.ACTIVE },
        DBtx,
      );

      // 5. Activate all installments for this loan
      await this.activateInstallmentsForLoan(loan.id, DBtx);

      // 6. Ensure the associated account is ACTIVE
      await this.accountRepo.update(
        loan.accountId,
        {
          status: AccountStatus.BUSY,
        },
        DBtx,
      );

      return updatedLoan;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const loan = await this.loansRepo.findOne({ where: { id } }, DBtx);
      if (!loan) {
        throw new NotFoundError('Loan', 'id', id);
      }
      if (loan.status !== LoanStatus.PENDING) {
        throw new ConflictException(
          `تنها وام های در وضعیت "در انتظار" قابل حذف می‌باشند.`,
        );
      }

      // Find journal entries for this loan
      const journalEntries = await this.journalEntriesRepo.findAll(
        {
          where: {
            targetType: JournalEntryTarget.LOAN,
            targetId: id,
          },
        },
        DBtx,
      );

      const journalId = journalEntries[0]?.journalId;

      const journal = await this.journalsRepo.findById(journalId, DBtx);

      const transactionId = journal?.transactionId;

      if (transactionId) {
        await this.transactionsService.reject(transactionId, DBtx);
      }

      // Delete the loan itself
      try {
        await this.loansRepo.softDelete(id, currentUserId, DBtx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('Loan', 'id', id);
        }
        throw e;
      }
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prismaTransactionalRepo.withTransaction(run);
    }
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  private async validateLoanTypeId(
    loanTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const loanType = await this.loanTypeRepo.findById(loanTypeId, tx);
    if (!loanType) {
      throw new NotFoundError('LoanType', 'id', loanTypeId);
    }
    return loanType;
  }

  private async validateAccountId(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const account = await this.accountService.findById(accountId, tx);
    if (!account) {
      throw new NotFoundError('Account', 'id', accountId);
    }
    return account;
  }

  private async checkLoanConflict(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const existingLoans = await this.loansRepo.findAll(
      {
        where: {
          accountId,
          status: LoanStatus.ACTIVE,
        },
      },
      tx,
    );
    if (existingLoans.length > 0) {
      throw new ConflictException(
        `حساب مورد نظر دارای وام فعال دیگری می‌باشد.`,
      );
    }
  }

  private async createInstallmentsForLoan(
    loan: Loan,
    tx?: Prisma.TransactionClient,
  ) {
    const installmentCount = loan.paymentMonths;

    const installmentAmount = (
      BigInt(loan.amount) / BigInt(installmentCount)
    ).toString();

    for (let i = 0; i < installmentCount; i++) {
      const startDate = new Date(loan.startDate);
      const dayOfMonth = startDate.getDate();

      // If start date is after 15th, skip to next month
      const monthsToAdd = dayOfMonth > 15 ? i + 2 : i + 1;

      const dueDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + monthsToAdd,
        1,
      );

      await this.installmentRepo.create(
        {
          loanId: loan.id,
          amount: installmentAmount,
          installmentNumber: i + 1,
          dueDate,
          status: InstallmentStatus.PENDING,
        },
        tx,
      );
    }
  }

  private validateLoanLimits(input: CreateLoanInput, loanType: LoanType) {
    const { paymentMonths } = input;
    const { minInstallments, maxInstallments } = loanType;
    if (paymentMonths < minInstallments || paymentMonths > maxInstallments) {
      throw new BadRequestException(
        `Loan payment months must be between ${minInstallments} and ${maxInstallments}.`,
      );
    }
  }

  private validateAccountBalanceForNewLoan(
    account: Account,
    loanAmount: string,
    loanType: LoanType,
  ) {
    const accountBalance = account.balanceSummary?.totalDeposits || 0;

    console.log('🚀 ---------------------🚀');
    console.log('🚀 ~ account:', account);
    console.log('🚀 ---------------------🚀');

    console.log('🚀 -----------------------------------🚀');
    console.log('🚀 ~ accountBalance:', accountBalance);
    console.log('🚀 -----------------------------------🚀');

    const requiredBalance =
      (loanType.creditRequirementPct / 100) * Number(loanAmount);

    console.log('🚀 -------------------------------------🚀');
    console.log('🚀 ~ requiredBalance:', requiredBalance);
    console.log('🚀 -------------------------------------🚀');

    if (accountBalance < requiredBalance) {
      throw new BadRequestException(`موجودی حساب برای این وام کافی نیست.`);
    }
  }

  private validateActiveUser(account: Account): User {
    const user = account.user;
    if (!user) {
      throw new BadRequestException('Account has no associated user');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Account owner is not active');
    }
    return user;
  }

  private calculateLoanFinancials(
    amount: string,
    commissionPercentage: number,
  ): { commissionAmount: number; netDisbursement: number } {
    const loanAmount = Number(amount);
    const commissionAmount = Math.floor(
      (commissionPercentage / 100) * loanAmount,
    );
    const netDisbursement = loanAmount - commissionAmount;

    return { commissionAmount, netDisbursement };
  }

  private async createLoanDisbursementTransaction(
    userId: string,
    loanId: string,
    accountId: string,
    loanAmount: string,
    netDisbursement: number,
    commissionAmount: number,
    tx: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const transactionInput: CreateTransactionWithJournalEntriesInput = {
      userId,
      kind: TransactionKind.LOAN_DISBURSEMENT,
      amount: loanAmount,
      note: 'تراکنش مربوط به وام',
      status: TransactionStatus.PENDING,
      journalEntries: [
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.LOANS_RECEIVABLE,
          amount: loanAmount,
          dc: DebitCredit.DEBIT,
          targetType: JournalEntryTarget.LOAN,
          targetId: loanId,
          accountId, // Denormalized for balance queries
        },
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.CASH,
          amount: netDisbursement.toString(),
          dc: DebitCredit.CREDIT,
        },
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.FEE_COMMISSION_INCOME,
          amount: commissionAmount.toString(),
          dc: DebitCredit.CREDIT,
        },
      ],
    };

    return this.createTransactionForLoan(transactionInput, tx);
  }

  private async createTransactionForLoan(
    transactionInput: CreateTransactionWithJournalEntriesInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    try {
      return await this.transactionsService.createSpecificTransaction(
        transactionInput,
        tx,
      );
    } catch {
      throw new BadRequestException(
        'something went wrong while creating transaction',
      );
    }
  }

  private async checkBankFinancialsForNewLoan(
    loanAmount: string,
    tx?: Prisma.TransactionClient,
  ) {
    const canApprove = await this.bankFinancialsService.canApproveLoan(
      loanAmount,
      tx,
    );
    if (!canApprove) {
      throw new BadRequestException(
        'Bank has insufficient funds to approve this loan.',
      );
    }
  }

  /**
   * Find the transaction associated with a loan by searching for journal entries
   * that target the loan. Returns the transaction through: JournalEntry -> Journal -> Transaction
   */
  private async findTransactionForLoan(
    loanId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const prisma = tx ?? this.prismaService;

    // Query journal entries with loan target, including the transaction
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        targetType: JournalEntryTarget.LOAN,
        targetId: loanId,
      },
      include: {
        journal: {
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!journalEntry?.journal?.transaction) {
      return null;
    }

    // Map Prisma transaction to domain Transaction
    const tx_data = journalEntry.journal.transaction;
    return {
      id: tx_data.id,
      code: tx_data.code,
      kind: tx_data.kind as Transaction['kind'],
      amount: String(tx_data.amount),
      status: tx_data.status as Transaction['status'],
      externalRef: tx_data.externalRef ?? undefined,
      note: tx_data.note ?? undefined,
      userId: tx_data.userId,
      createdAt: tx_data.createdAt,
      updatedAt: tx_data.updatedAt,
      images: [],
      isDeleted: tx_data.isDeleted,
      deletedAt: tx_data.deletedAt ?? undefined,
      deletedBy: tx_data.deletedBy ?? undefined,
    };
  }

  /**
   * Activate all installments for a given loan.
   */
  private async activateInstallmentsForLoan(
    loanId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const installments = await this.installmentRepo.findAll(
      {
        where: { loanId },
      },
      tx,
    );

    await Promise.all(
      installments.map((installment) =>
        this.installmentRepo.update(
          installment.id,
          { status: InstallmentStatus.ACTIVE },
          tx,
        ),
      ),
    );
  }
}
