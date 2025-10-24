import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import {
  CreateJournalWithEntriesUseCase,
  DebitCredit,
  JournalEntrySpec,
  LEDGER_ACCOUNT_CODES,
  type Transaction,
  TransactionKindHelper,
} from '@app/domain';
import type {
  CreateTransactionInput,
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
import { ConflictException, Injectable } from '@nestjs/common';

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
      const journalEntries = this.buildJournalEntrySpecs(transaction);

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

  /**
   * Builds journal entry specifications for a transaction.
   * Determines debit/credit entries based on whether cash is coming in or out.
   */
  private buildJournalEntrySpecs(transaction: Transaction): JournalEntrySpec[] {
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
    const exists = await this.transactionsRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Transaction', 'id', id);
    }
    try {
      await this.transactionsRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Transaction', 'id', id);
      }
      throw e;
    }
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
