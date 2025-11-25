import { NotFoundError } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { TransactionsService } from '@app/application/transaction/services/transactions.service';
import {
  Account,
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
  type CreateLoanInput,
  type Loan,
  type UpdateLoanInput,
} from '@app/domain';

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
  Injectable,
} from '@nestjs/common';
import { BankFinancialsService } from './bank-financials.service';

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepo: PrismaLoanRepository,
    private readonly loanTypeRepo: PrismaLoanTypeRepository,
    private readonly accountRepo: PrismaAccountRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly installmentRepo: PrismaInstallmentRepository,
    private readonly journalEntriesRepo: PrismaJournalEntryRepository,
    private readonly prismaService: PrismaService,
    private readonly bankFinancialsService: BankFinancialsService,
    private readonly transactionsService: TransactionsService,
    private readonly journalsRepo: PrismaJournalRepository,
  ) {}

  async findAll(query?: ListLoanQueryInput, tx?: Prisma.TransactionClient) {
    return paginatePrisma<Loan, Prisma.LoanFindManyArgs, Prisma.LoanWhereInput>(
      {
        repo: this.loansRepo,
        query: query ?? {},
        where: {
          ...(query?.accountId && { accountId: query.accountId }),
          ...(query?.loanTypeId && { loanTypeId: query.loanTypeId }),
          ...(query?.status && { status: query.status }),
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
    return loan;
  }

  async create(
    input: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    console.log('[LoansService.create] Starting loan creation', {
      accountId: input.accountId,
      amount: input.amount,
      paymentMonths: input.paymentMonths,
    });

    const run = async (DBtx: Prisma.TransactionClient) => {
      console.log('[LoansService.create] Inside transaction callback');

      // 1. Validate and fetch dependencies
      const loanType = await this.validateLoanTypeId(input.loanTypeId, DBtx);
      const account = await this.validateAccountId(input.accountId, DBtx);
      const user = this.validateActiveUser(account);

      // 2. Perform business rule validations
      this.validateLoanLimits(input, loanType);
      await this.checkBankFinancialsForNewLoan(input.amount, DBtx);
      await this.checkLoanConflict(input.accountId, DBtx);

      // 3. Create the loan record
      const loan = await this.loansRepo.create(input, DBtx);
      console.log('[LoansService.create] Loan created with id:', loan.id);

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
      console.log('[LoansService.create] About to create installments');
      await this.createInstallmentsForLoan(loan, DBtx);
      console.log('[LoansService.create] Installments created');

      return loan;
    };

    const result = tx
      ? run(tx)
      : this.prismaTransactionalRepo.withTransaction(run);
    console.log('[LoansService.create] Transaction completed');
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

      return updatedLoan;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    console.log(
      `[LoansService.delete] Attempting to delete loan with id: ${id}`,
    );
    const run = async (DBtx: Prisma.TransactionClient) => {
      console.log(
        `[LoansService.delete] Inside transaction callback for loan id: ${id}`,
      );
      const loan = await this.loansRepo.findOne({ where: { id } }, DBtx);
      if (!loan) {
        console.log(`[LoansService.delete] Loan not found: ${id}`);
        throw new NotFoundError('Loan', 'id', id);
      }
      if (loan.status !== LoanStatus.PENDING) {
        console.log(
          `[LoansService.delete] Loan status is not PENDING: ${loan.status}`,
        );
        throw new ConflictException(
          `تنها وام های در وضعیت "در انتظار" قابل حذف می‌باشند.`,
        );
      }

      // Delete all installments for this loan
      console.log(
        `[LoansService.delete] Deleting installments for loan id: ${id}`,
      );
      await this.installmentRepo.deleteMany({ loanId: id }, DBtx);

      // Find journal entries for this loan
      console.log(
        `[LoansService.delete] Fetching journal entries for loan id: ${id}`,
      );
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

      console.log(journalEntries);

      const transactionId = journal?.transactionId;

      console.log('🚀 ---------------------------------🚀');
      console.log('🚀 ~ transactionId:', transactionId);
      console.log('🚀 ---------------------------------🚀');

      if (transactionId) {
        console.log(
          `[LoansService.delete] Rejecting transaction with id: ${transactionId} for loan id: ${id}`,
        );
        await this.transactionsService.reject(transactionId, DBtx);
      }

      // Delete the loan itself
      try {
        console.log(
          `[LoansService.delete] Deleting loan record with id: ${id}`,
        );
        await this.loansRepo.delete(id, DBtx);
        console.log(`[LoansService.delete] Loan deleted successfully: ${id}`);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          console.log(
            `[LoansService.delete] Loan not found during delete: ${id}`,
          );
          throw new NotFoundError('Loan', 'id', id);
        }
        console.log(`[LoansService.delete] Error deleting loan: ${id}`, e);
        throw e;
      }
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prismaTransactionalRepo.withTransaction(run);
    }
    console.log(
      `[LoansService.delete] Delete operation completed for loan id: ${id}`,
    );
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
    const account = await this.accountRepo.findById(
      accountId,
      { includeUser: true },
      tx,
    );
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
    console.log(
      `[createInstallmentsForLoan] Creating ${installmentCount} installments for loan ${loan.id}`,
    );

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

    console.log(
      `[createInstallmentsForLoan] Completed creating ${installmentCount} installments for loan ${loan.id}`,
    );
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

  private validateActiveUser(account: Account): User {
    const user = account.user;
    if (!user) {
      throw new BadRequestException('Account has no associated user');
    }
    if (!user.isActive) {
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
