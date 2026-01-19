import {
  AccountsService,
  FilesService,
  JournalsService,
  NotFoundError,
  PaginationQueryDto,
} from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import {
  AccountStatus,
  CreateJournalWithEntriesUseCase,
  DebitCredit,
  InstallmentStatus,
  Journal,
  JournalEntry,
  JournalEntrySpec,
  JournalEntryTarget,
  JournalStatus,
  LEDGER_ACCOUNT_CODES,
  LoanStatus,
  SubscriptionFeeStatus,
  type Transaction,
  TransactionKind,
  TransactionKindHelper,
  TransactionStatus,
} from '@app/domain';
import type {
  CreateTransactionInput,
  CreateTransactionWithJournalEntriesInput,
  CreateTransferTransactionInput,
  ListTransactionParams,
  UpdateTransactionInput,
} from '@app/domain/transaction/types/transaction.type';
import {
  PrismaAccountRepository,
  PrismaInstallmentRepository,
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
  PrismaLoanRepository,
  PrismaSubscriptionFeeRepository,
  PrismaTransactionRepository,
  PrismaUserRepository,
} from '@app/infra';
import { PrismaJournalEntryRepository } from '@app/infra/ledger/repositories/prisma-journal-entry.repository';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { JournalTargetType, Prisma } from '@generated/prisma';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SubscriptionFeesService } from '../../bank/services/subscription-fees.service';

@Injectable()
export class TransactionsService {
  private readonly createJournalUseCase: CreateJournalWithEntriesUseCase;

  constructor(
    private readonly transactionsRepo: PrismaTransactionRepository,
    private readonly usersRepo: PrismaUserRepository,
    private readonly ledgerAccountRepo: PrismaLedgerAccountRepository,
    private readonly journalRepo: PrismaJournalRepository,
    private readonly journalEntryRepo: PrismaJournalEntryRepository,
    private readonly installmentRepo: PrismaInstallmentRepository,
    private readonly subscriptionFeesRepo: PrismaSubscriptionFeeRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly loanRepo: PrismaLoanRepository,
    private readonly accountRepo: PrismaAccountRepository,
    @Inject(forwardRef(() => AccountsService))
    private readonly accountService: AccountsService,
    @Inject(forwardRef(() => JournalsService))
    private readonly journalService: JournalsService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
    @Inject(forwardRef(() => SubscriptionFeesService))
    private readonly subscriptionFeeService: SubscriptionFeesService,
  ) {
    // Initialize the use case with required dependencies
    this.createJournalUseCase = new CreateJournalWithEntriesUseCase(
      journalRepo,
      journalEntryRepo,
      ledgerAccountRepo,
      prismaTransactionalRepo,
    );
  }

  async findAll(query?: ListTransactionParams, tx?: Prisma.TransactionClient) {
    const clauses: Prisma.TransactionWhereInput[] = [];

    // Basic transaction filters
    const base: Prisma.TransactionWhereInput = {
      ...(query?.userId && { userId: query.userId }),
      ...(query?.kind && { kind: query.kind }),
      ...(query?.status && { status: query.status }),
      ...(query?.isDeleted !== undefined && { isDeleted: query.isDeleted }),
    };
    if (Object.keys(base).length) clauses.push(base);

    // Nested journal entry filters (accountId, targetType, targetId)
    const entryFilter: Record<string, unknown> = {};
    if (query?.accountId) entryFilter.accountId = query.accountId;
    if (query?.targetType)
      entryFilter.targetType = query.targetType as unknown as string;
    if (query?.targetId) entryFilter.targetId = query.targetId;

    if (Object.keys(entryFilter).length) {
      clauses.push({
        journal: { some: { entries: { some: entryFilter } } },
      } as Prisma.TransactionWhereInput);
    }

    const finalWhere: Prisma.TransactionWhereInput =
      clauses.length === 0
        ? {}
        : clauses.length === 1
          ? clauses[0]
          : ({ AND: clauses } as Prisma.TransactionWhereInput);

    const defaultInclude: Prisma.TransactionInclude = {
      user: {
        include: {
          identity: {
            select: { id: true, name: true },
          },
        },
      },
    };

    const include = {
      ...(defaultInclude as object),
    } as Prisma.TransactionInclude;

    return paginatePrisma<
      Transaction,
      Prisma.TransactionFindManyArgs,
      Prisma.TransactionWhereInput
    >({
      repo: this.transactionsRepo,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['externalRef', 'note'],
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      where: finalWhere,
      include,
      tx,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const transaction = await this.transactionsRepo.findByIdWithRelations(
      id,
      tx,
    );
    if (!transaction) {
      throw new NotFoundError('Transaction', 'id', id);
    }
    return transaction;
  }

  async create(input: CreateTransactionInput, tx?: Prisma.TransactionClient) {
    const run = async (trx: Prisma.TransactionClient) => {
      // 1. Validate user exists and is active
      await this.usersRepo.findActiveUserOrThrow(input.userId, trx);

      // 2. Check external reference uniqueness if provided
      if (input.externalRef) {
        await this.uniqueExternalRefCheck(input.externalRef, trx);
      }

      // 3. Create the transaction record
      const transaction = await this.transactionsRepo.create(input, trx);

      // 4. Build journal entry specifications based on transaction kind
      const journalEntries = this.createTransactionJournalEntries(transaction);

      // 5. Create journal with balanced entries using the use case
      await this.createJournalUseCase.execute(
        transaction.id,
        journalEntries,
        trx,
      );

      return transaction;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async createTransferTransaction(
    input: CreateTransferTransactionInput,
    userId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (trx: Prisma.TransactionClient) => {
      // If a userId was provided, ensure the user exists and is active
      if (userId) {
        await this.usersRepo.findActiveUserOrThrow(userId, trx);
      }
      const sourceAccount = await this.accountService.findById(
        input.sourceAccountId,
        trx,
      );
      const destinationAccount = await this.accountService.findById(
        input.destinationAccountId,
        trx,
      );

      if (!sourceAccount || sourceAccount.status === AccountStatus.INACTIVE) {
        throw new NotFoundError('Account', 'id', input.sourceAccountId);
      }

      if (
        !destinationAccount ||
        destinationAccount.status === AccountStatus.INACTIVE
      ) {
        throw new NotFoundError('Account', 'id', input.destinationAccountId);
      }

      // check if account has enough balance
      if (
        Number(input.amount) >
        Number(sourceAccount.balanceSummary?.totalDeposits)
      ) {
        throw new ConflictException('موجودی حساب مبدا کافی نیست.');
      }

      // Create the transaction record
      const transaction = await this.transactionsRepo.create(
        {
          userId: userId ?? '',
          kind: TransactionKind.TRANSFER,
          amount: input.amount,
          note:
            input.description ??
            `انتقال بین حساب از ${sourceAccount.code} به ${destinationAccount.code}`,
          status: TransactionStatus.APPROVED,
        },
        trx,
      );

      // create journal for transaction
      const journal = await this.journalRepo.create(
        {
          transactionId: transaction.id,
          status: JournalStatus.POSTED,
          postedAt: new Date(),
        },
        trx,
      );

      const ledgerAccount = await this.ledgerAccountRepo.findByCode(
        LEDGER_ACCOUNT_CODES.CUSTOMER_DEPOSITS,
        trx,
      );

      // create journal entries for source and destination accounts

      await this.journalEntryRepo.create(
        {
          journalId: journal.id,
          ledgerAccountId: ledgerAccount!.id,
          amount: input.amount,
          dc: DebitCredit.DEBIT,
          accountId: sourceAccount.id,
          targetType: JournalEntryTarget.ACCOUNT,
          targetId: sourceAccount.id,
        },
        trx,
      );

      await this.journalEntryRepo.create(
        {
          journalId: journal.id,
          ledgerAccountId: ledgerAccount!.id,
          amount: input.amount,
          dc: DebitCredit.CREDIT,
          accountId: destinationAccount.id,
          targetType: JournalEntryTarget.ACCOUNT,
          targetId: destinationAccount.id,
        },
        trx,
      );

      return transaction;
    };
    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async createSpecificTransaction(
    input: CreateTransactionWithJournalEntriesInput,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (trx: Prisma.TransactionClient) => {
      await this.usersRepo.findActiveUserOrThrow(input.userId, trx);

      // Extract only the transaction fields (exclude journalEntries)
      const { journalEntries, ...transactionData } = input;

      const transaction = await this.transactionsRepo.create(
        transactionData,
        trx,
      );

      await this.createJournalUseCase.execute(
        transaction.id,
        journalEntries,
        trx,
      );

      return transaction;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async addEntriesToTransaction(
    transactionId: string,
    newEntries: JournalEntrySpec[],
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    const run = async (trx: Prisma.TransactionClient) => {
      // 1. Verify transaction exists and is PENDING
      const transaction = await this.transactionsRepo.findById(
        transactionId,
        trx,
      );
      if (!transaction) {
        throw new NotFoundError('Transaction', 'id', transactionId);
      }
      if (transaction.status !== TransactionStatus.PENDING) {
        throw new ConflictException(
          `Cannot add entries to transaction-${transaction.code} because it is ${transaction.status}. Only PENDING transactions can be modified.`,
        );
      }

      // 2. Find the journal for this transaction
      const journals = await this.journalRepo.findAllWithEntries(
        {
          where: { transactionId },
        },
        trx,
      );
      if (journals.length === 0) {
        throw new ConflictException(
          `No journal found for transaction-${transaction.code}.`,
        );
      }
      if (journals.length > 1) {
        throw new ConflictException(
          `Multiple journals found for transaction-${transaction.code}. Expected exactly one.`,
        );
      }

      const journal = journals[0];

      // 3. Verify journal is PENDING
      if (journal.status !== JournalStatus.PENDING) {
        throw new ConflictException(
          `Cannot add entries to journal-${journal.code} because it is ${journal.status}. Only PENDING journals can be modified.`,
        );
      }

      // 4. Fetch ledger accounts for new entries
      const accountCodes = newEntries.map((entry) => entry.ledgerAccountCode);
      const accounts = await Promise.all(
        accountCodes.map((code) =>
          this.ledgerAccountRepo.findByCode(code, trx),
        ),
      );

      // 5. Build account map and validate
      const accountMap = new Map<string, string>();
      accountCodes.forEach((code, index) => {
        const account = accounts[index];
        if (!account) {
          throw new NotFoundError('LedgerAccount', 'code', code);
        }
        accountMap.set(code, account.id);
      });

      // 6. Create new journal entries
      const journalEntryInputs = newEntries.map((entry) => ({
        journalId: journal.id,
        ledgerAccountId: accountMap.get(entry.ledgerAccountCode)!,
        amount: entry.amount,
        dc: entry.dc,
        targetType: entry.targetType,
        targetId: entry.targetId,
        accountId: entry.accountId, // Denormalized for balance queries
      }));

      await this.journalEntryRepo.createMany(journalEntryInputs, trx);

      // 7. Validate the journal is still balanced after adding entries
      const updatedJournals = await this.journalRepo.findAllWithEntries(
        {
          where: { id: journal.id },
        },
        trx,
      );
      const updatedJournal = updatedJournals[0];

      this.validateJournalIsBalanced(updatedJournal, transaction.code);

      return updatedJournal;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async approve(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const run = async (trx: Prisma.TransactionClient) => {
      // 1. Fetch and validate transaction exists
      const transaction = await this.transactionsRepo.findById(id, trx);
      if (!transaction) {
        throw new NotFoundError('Transaction', 'id', id);
      }

      // 2. Validate journal is ready for posting
      const journal = await this.validateJournalForApproval(transaction, trx);

      // 3. Atomically update transaction and post journal
      const updatedTransaction = await this.transactionsRepo.update(
        id,
        { status: TransactionStatus.APPROVED },
        trx,
      );

      await this.journalRepo.update(
        journal.id,
        { status: JournalStatus.POSTED, postedAt: new Date() },
        trx,
      );

      await this.journalEntryRepo.updateMany(
        { journalId: journal.id },
        { removable: false },
        trx,
      );

      // Mark related installments and subscription fees as paid when their
      // corresponding journal entries are posted.
      const entries = journal.entries ?? [];
      for (const entry of entries) {
        if (
          String(entry.targetType) === JournalTargetType.INSTALLMENT &&
          entry.targetId
        ) {
          // Update installment to PAID
          const updatedInstallment = await this.installmentRepo.update(
            entry.targetId,
            {
              status: InstallmentStatus.PAID,
              paymentDate: new Date(),
              journalEntryId: entry.id,
            },
            trx,
          );

          const loan = await this.loanRepo.findOne(
            {
              where: {
                id: updatedInstallment.loanId,
              },
            },
            trx,
          );

          // get the number of unpaid installments for the loan
          // Count the number of unpaid (i.e., not PAID) installments for the loan
          const installments = await this.installmentRepo.count(
            {
              loanId: loan?.id,
              status: { not: InstallmentStatus.PAID },
            },
            trx,
          );

          if (installments === 0 && loan) {
            // update the loan status to paid
            await this.loanRepo.update(
              loan.id,
              { status: LoanStatus.PAID },
              trx,
            );
            await this.accountRepo.update(
              loan.accountId,
              { status: AccountStatus.ACTIVE },
              trx,
            );
          }
        }

        if (
          String(entry.targetType) === JournalTargetType.SUBSCRIPTION_FEE &&
          entry.targetId
        ) {
          // Update subscription fee to PAID
          await this.subscriptionFeesRepo.update(
            entry.targetId,
            {
              status: SubscriptionFeeStatus.PAID,
              paidAt: new Date(),
              journalEntryId: entry.id,
            },
            trx,
          );
          // Create next subscription fee
          // Ensure we have the accountId: prefer denormalized value on the
          // journal entry, otherwise fetch the subscription fee record.
          const accountId =
            entry.accountId ??
            (await this.subscriptionFeesRepo.findById(entry.targetId, trx))
              ?.accountId;
          if (!accountId) {
            throw new NotFoundError('SubscriptionFee', 'id', entry.targetId);
          }

          await this.subscriptionFeeService.createNext(
            {
              accountId,
              numberOfMonths: 1,
            },
            trx,
          );
        }
      }

      return updatedTransaction;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  private async validateJournalForApproval(
    transaction: Transaction,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    // 1. Fetch journal with entries
    const journal = await this.getSingleJournalForTransaction(
      transaction.id,
      transaction.code,
      tx,
    );

    // 2. Validate journal has entries
    this.validateJournalHasEntries(journal, transaction.code);

    // 3. Validate journal is in PENDING status
    this.validateJournalIsPending(journal, transaction.code);

    // 4. Validate journal is balanced
    this.validateJournalIsBalanced(journal, transaction.code);

    return journal;
  }

  private async getSingleJournalForTransaction(
    transactionId: string,
    transactionCode: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    const journals = await this.journalRepo.findAllWithEntries(
      { where: { transactionId } },
      tx,
    );

    if (journals.length === 0) {
      throw new ConflictException(
        `No journals found for transaction-${transactionCode}.`,
      );
    }

    if (journals.length > 1) {
      throw new ConflictException(
        `Multiple journals found for transaction-${transactionCode}. Expected exactly one journal.`,
      );
    }

    return journals[0];
  }

  private validateJournalHasEntries(
    journal: Journal,
    transactionCode: number,
  ): void {
    const entries = journal.entries || [];
    if (entries.length === 0) {
      throw new ConflictException(
        `No journal entries found for transaction-${transactionCode}.`,
      );
    }
  }

  private validateJournalIsPending(
    journal: Journal,
    transactionCode: number,
  ): void {
    if (journal.status !== JournalStatus.PENDING) {
      throw new ConflictException(
        `Cannot approve transaction-${transactionCode} because journal-${journal.code} is not PENDING (current status: ${journal.status}).`,
      );
    }
  }

  private validateJournalIsBalanced(
    journal: Journal,
    transactionCode: number,
  ): void {
    const entries = journal.entries || [];

    const totalDebits = this.calculateTotalByDebitCredit(
      entries,
      DebitCredit.DEBIT,
    );
    const totalCredits = this.calculateTotalByDebitCredit(
      entries,
      DebitCredit.CREDIT,
    );

    // Use 4 decimal precision to match database Decimal(18,4)
    const debitsFormatted = totalDebits.toFixed(4);
    const creditsFormatted = totalCredits.toFixed(4);

    if (debitsFormatted !== creditsFormatted) {
      throw new ConflictException(
        `Cannot approve transaction-${transactionCode} because journal-${journal.code} is not balanced. ` +
          `Total Debits: ${debitsFormatted}, Total Credits: ${creditsFormatted}.`,
      );
    }
  }

  private calculateTotalByDebitCredit(
    entries: JournalEntry[],
    dc: DebitCredit,
  ): number {
    return entries
      .filter((e) => e.dc === dc)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }

  private createTransactionJournalEntries(
    transaction: Transaction,
  ): JournalEntrySpec[] {
    const isCashIn = TransactionKindHelper.isCashIn(transaction.kind);

    if (isCashIn) {
      // Cash coming in: Debit Cash, Credit Unapplied Receipts
      return [
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.CASH,
          amount: transaction.amount,
          dc: DebitCredit.DEBIT,
        },
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.UNAPPLIED_RECEIPTS,
          amount: transaction.amount,
          dc: DebitCredit.CREDIT,
        },
      ];
    } else {
      // Cash going out: Credit Cash, Debit Unapplied Disbursements
      return [
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.CASH,
          amount: transaction.amount,
          dc: DebitCredit.CREDIT,
        },
        {
          ledgerAccountCode: LEDGER_ACCOUNT_CODES.UNAPPLIED_DISBURSEMENTS,
          amount: transaction.amount,
          dc: DebitCredit.DEBIT,
        },
      ];
    }
  }

  async update(
    id: string,
    transaction: UpdateTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const exists = await this.transactionsRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Transaction', 'id', id);
    }
    try {
      return await this.transactionsRepo.update(id, transaction, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Transaction', 'id', id);
      }
      throw e;
    }
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const exists = await this.transactionsRepo.findByIdWithRelations(
        id,
        DBtx,
      );

      if (!exists) {
        throw new NotFoundError('Transaction', 'id', id);
      }
      try {
        if (exists.images.length > 0) {
          for (const image of exists.images) {
            await this.filesService.softDelete(
              image.fileId,
              currentUserId,
              DBtx,
            );
          }
        }

        await this.transactionsRepo.softDelete(id, currentUserId, DBtx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('Transaction', 'id', id);
        }
        throw e;
      }
    };
    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async reject(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // Fetch and validate transaction exists
      const transaction = await this.transactionsRepo.findById(id, DBtx);
      if (!transaction) {
        throw new NotFoundError('Transaction', 'id', id);
      }

      // Fetch the journal associated with this transaction
      const journal = await this.getSingleJournalForTransaction(
        transaction.id,
        transaction.code,
        DBtx,
      );

      // Ensure journal is in PENDING status
      if (journal.status !== JournalStatus.PENDING) {
        throw new ConflictException(`تغییر وضعیت ژورنال امکان‌پذیر نیست`);
      }

      // Update transaction status to REJECTED
      const updatedTransaction = await this.transactionsRepo.update(
        id,
        {
          status: TransactionStatus.REJECTED,
        },
        DBtx,
      );
      // Soft delete the transaction
      await this.transactionsRepo.softDelete(id, currentUserId, DBtx);

      // Void the journal associated with this transaction
      await this.journalService.void(journal.id, DBtx);

      // get journal entries for the journal
      const journalEntries = await this.journalEntryRepo.findAll(
        { where: { journalId: journal.id } },
        DBtx,
      );

      // For each journal entry, if it is linked to an installment or subscription fee, revert its status
      for (const entry of journalEntries) {
        if (
          String(entry.targetType) === JournalTargetType.INSTALLMENT &&
          entry.targetId
        ) {
          // Revert installment to active
          await this.installmentRepo.update(
            entry.targetId,
            {
              status: InstallmentStatus.ACTIVE,
            },
            DBtx,
          );
        }

        if (
          String(entry.targetType) === JournalTargetType.SUBSCRIPTION_FEE &&
          entry.targetId
        ) {
          // Revert subscription fee to due
          await this.subscriptionFeesRepo.update(
            entry.targetId,
            {
              status: SubscriptionFeeStatus.DUE,
              paidAt: null,
              journalEntryId: null,
            },
            DBtx,
          );
        }
      }

      return updatedTransaction;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  private async uniqueExternalRefCheck(
    externalRef: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const existing = await this.transactionsRepo.findAll(
      {
        where: { externalRef, isDeleted: false },
      },
      tx,
    );
    if (existing.length > 0) {
      throw new ConflictException(
        `Transaction with externalRef '${externalRef}' already exists.`,
      );
    }
  }
}
