import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { TransactionsService } from '@app/application/transaction/services/transactions.service';
import {
  Account,
  CreateTransactionWithJournalEntriesInput,
  DebitCredit,
  InstallmentStatus,
  JournalEntryTarget,
  LEDGER_ACCOUNT_CODES,
  LoanStatus,
  LoanType,
  Transaction,
  User,
  type CreateLoanInput,
  type Loan,
  type UpdateLoanInput,
} from '@app/domain';

import {
  PrismaAccountRepository,
  PrismaInstallmentRepository,
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
    private readonly prismaService: PrismaService,
    private readonly bankFinancialsService: BankFinancialsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<Loan, Prisma.LoanFindManyArgs, Prisma.LoanWhereInput>(
      {
        repo: this.loansRepo,
        query: query ?? new PaginationQueryDto(),
        searchFields: ['name'],
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        tx,
      },
    );
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Loan> {
    const loan = await this.loansRepo.findById(id, tx);
    if (!loan) {
      throw new NotFoundError('Loan', 'id', id);
    }
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
        input.amount,
        netDisbursement,
        commissionAmount,
        DBtx,
      );

      // 6. Generate installment schedule
      await this.createInstallmentsForLoan(loan, DBtx);

      return loan;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async update(
    id: string,
    loan: UpdateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const exists = await this.loansRepo.findById(id, tx);
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

      // 3. Approve the transaction (this also posts the journal atomically)
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
    const exists = await this.loansRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Loan', 'id', id);
    }
    try {
      await this.loansRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Loan', 'id', id);
      }
      throw e;
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
        `Account with id '${accountId}' already has an active loan.`,
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
    loanAmount: string,
    netDisbursement: number,
    commissionAmount: number,
    tx: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const transactionInput: CreateTransactionWithJournalEntriesInput = {
      userId,
      kind: 'LOAN_DISBURSEMENT',
      amount: loanAmount,
      note: 'تراکنش مربوط به وام',
      status: 'PENDING',
      journalEntries: [
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.LOANS_RECEIVABLE,
          amount: loanAmount,
          dc: DebitCredit.DEBIT,
          targetType: JournalEntryTarget.LOAN,
          targetId: loanId,
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
