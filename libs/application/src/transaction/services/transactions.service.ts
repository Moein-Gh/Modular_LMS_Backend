import {
  JournalsService,
  NotFoundError,
  PaginationQueryDto,
} from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import {
  CreateJournalWithEntriesUseCase,
  DebitCredit,
  Journal,
  JournalEntry,
  JournalEntrySpec,
  JournalStatus,
  LEDGER_ACCOUNT_CODES,
  type Transaction,
  TransactionKindHelper,
  TransactionStatus,
} from '@app/domain';
import type {
  CreateTransactionInput,
  CreateTransactionWithJournalEntriesInput,
  UpdateTransactionInput,
} from '@app/domain/transaction/types/transaction.type';
import {
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
  PrismaTransactionRepository,
  PrismaUserRepository,
} from '@app/infra';
import { PrismaJournalEntryRepository } from '@app/infra/ledger/repositories/prisma-journal-entry.repository';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class TransactionsService {
  private readonly createJournalUseCase: CreateJournalWithEntriesUseCase;

  constructor(
    private readonly transactionsRepo: PrismaTransactionRepository,
    private readonly usersRepo: PrismaUserRepository,
    private readonly ledgerAccountRepo: PrismaLedgerAccountRepository,
    private readonly journalRepo: PrismaJournalRepository,
    private readonly journalEntryRepo: PrismaJournalEntryRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    @Inject(forwardRef(() => JournalsService))
    private readonly journalService: JournalsService,
  ) {
    // Initialize the use case with required dependencies
    this.createJournalUseCase = new CreateJournalWithEntriesUseCase(
      journalRepo,
      journalEntryRepo,
      ledgerAccountRepo,
      prismaTransactionalRepo,
    );
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
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
      include: {
        user: {
          include: {
            identity: {
              select: { id: true, name: true },
            },
          },
        },
      },
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

  /**
   * Add additional journal entries to an existing transaction.
   * This is useful when you need to append entries to a pending transaction.
   *
   * IMPORTANT:
   * - The transaction must be in PENDING status
   * - The journal must be in PENDING status
   * - After adding entries, the journal must remain balanced
   *
   * @param transactionId - ID of the existing transaction
   * @param newEntries - Array of new journal entry specifications to add
   * @param tx - Optional transaction client
   * @returns The updated journal with all entries
   */
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

  /**
   * Approve a transaction and post its journal.
   * This validates the transaction's journal is balanced and in PENDING status,
   * then atomically updates both the transaction and journal status.
   */
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

      return updatedTransaction;
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  /**
   * Validates that the transaction has exactly one journal that is:
   * - In PENDING status
   * - Has at least one entry
   * - Is balanced (debits = credits)
   *
   * @throws ConflictException if validation fails
   * @returns The validated journal
   */
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

  /**
   * Fetches and validates that exactly one journal exists for the transaction.
   */
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

  /**
   * Validates that the journal has at least one entry.
   */
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

  /**
   * Validates that the journal is in PENDING status.
   */
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

  /**
   * Validates that the journal entries are balanced (total debits = total credits).
   * Uses 4 decimal precision to match the database schema.
   */
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

  /**
   * Calculates the total amount for entries of a specific debit/credit type.
   */
  private calculateTotalByDebitCredit(
    entries: JournalEntry[],
    dc: DebitCredit,
  ): number {
    return entries
      .filter((e) => e.dc === dc)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
  }

  /**
   * Builds journal entry specifications for a transaction.
   * Determines debit/credit entries based on whether cash is coming in or out.
   */
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

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const exists = await this.transactionsRepo.findById(id, DBtx);

      if (!exists) {
        throw new NotFoundError('Transaction', 'id', id);
      }
      try {
        await this.transactionsRepo.delete(id, DBtx);
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
        { status: TransactionStatus.REJECTED },
        DBtx,
      );

      // Void the journal associated with this transaction
      await this.journalService.void(journal.id, DBtx);

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
        where: { externalRef },
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
