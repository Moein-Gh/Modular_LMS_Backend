import {
  AllocationType,
  InstallmentStatus,
  Journal,
  LedgerAccount,
  SubscriptionFeeStatus,
  TransactionStatus,
  type JournalEntry,
} from '@app/domain';
import {
  DebitCredit,
  JournalEntryTarget,
} from '@app/domain/ledger/entities/journal-entry.entity';
import { JournalStatus } from '@app/domain/ledger/entities/journal.entity';
import {
  PrismaJournalEntryRepository,
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginatePrisma } from '../common/pagination.util';
import type { AddSingleJournalEntryDto } from './dto/add-single-journal-entry.dto';
import type { GetJournalsQueryDto } from './dto/get-journals-query.dto';

@Injectable()
export class JournalsService {
  constructor(
    @Inject('JournalRepository')
    private readonly journalRepository: PrismaJournalRepository,
    @Inject('JournalEntryRepository')
    private readonly journalEntryRepository: PrismaJournalEntryRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly ledgerAccountRepository: PrismaLedgerAccountRepository,
  ) {}

  async findOne(id: string, includeEntries = false) {
    const j = includeEntries
      ? await this.journalRepository.findByIdWithEntries(id)
      : await this.journalRepository.findById(id);

    if (!j) throw new NotFoundException('Journal not found');
    return j;
  }

  async findAll(query?: GetJournalsQueryDto, tx?: Prisma.TransactionClient) {
    const includeEntries = query?.includeEntries ?? false;

    // If including entries, we need to use a different repository method
    if (includeEntries) {
      return this.findAllWithEntries(query, tx);
    }

    const where: Prisma.JournalWhereInput = {};

    if (query?.search) {
      where.note = { contains: query.search, mode: 'insensitive' };
    }

    if (query?.transactionId) {
      where.transactionId = query?.transactionId;
    }

    return paginatePrisma<
      Journal,
      Prisma.JournalFindManyArgs,
      Prisma.JournalWhereInput
    >({
      repo: this.journalRepository,
      where,
      query: query ?? new PaginationQueryDto(),
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  private async findAllWithEntries(
    query?: GetJournalsQueryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.JournalWhereInput = {};

    if (query?.search) {
      whereConditions.note = { contains: query.search, mode: 'insensitive' };
    }
    if (query?.transactionId) {
      whereConditions.transactionId = query?.transactionId;
    }

    const [items, totalItems] = await Promise.all([
      this.journalRepository.findAllWithEntries(
        {
          where: whereConditions,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        },
        tx,
      ),
      this.journalRepository.count(whereConditions, tx),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
    };
  }

  async void(id: string, tx?: Prisma.TransactionClient) {
    const j = await this.journalRepository.findById(id, tx);
    if (!j) throw new NotFoundException('Journal not found');

    if (j.status === JournalStatus.VOIDED) {
      throw new ConflictException('Journal is already voided');
    }

    return this.journalRepository.update(
      id,
      { status: JournalStatus.VOIDED },
      tx,
    );
  }

  async remove(id: string, tx?: Prisma.TransactionClient) {
    const j = await this.journalRepository.findById(id, tx);
    if (!j) throw new NotFoundException('Journal not found');
    await this.journalRepository.delete(id);
  }

  /**
   * Resolves the accountId from targetType and targetId.
   * This denormalizes the accountId for efficient balance queries.
   */
  private async resolveAccountId(
    targetType: JournalEntryTarget | undefined,
    targetId: string | undefined,
    tx: Prisma.TransactionClient,
  ): Promise<string | undefined> {
    if (!targetType || !targetId) return undefined;

    switch (targetType) {
      case JournalEntryTarget.ACCOUNT:
        return targetId;

      case JournalEntryTarget.SUBSCRIPTION_FEE: {
        const subscriptionFee = await tx.subscriptionFee.findUnique({
          where: { id: targetId },
          select: { accountId: true },
        });
        return subscriptionFee?.accountId;
      }

      case JournalEntryTarget.INSTALLMENT: {
        const installment = await tx.installment.findUnique({
          where: { id: targetId },
          select: { loan: { select: { accountId: true } } },
        });
        return installment?.loan?.accountId;
      }

      case JournalEntryTarget.LOAN: {
        const loan = await tx.loan.findUnique({
          where: { id: targetId },
          select: { accountId: true },
        });
        return loan?.accountId;
      }

      default:
        return undefined;
    }
  }

  async create(
    dto: AddSingleJournalEntryDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    const run = async (DBtx: Prisma.TransactionClient): Promise<Journal> => {
      // 1. Validate journal exists and is in PENDING status
      const journal = await this.journalRepository.findById(
        dto.journalId,
        DBtx,
      );
      if (!journal) {
        throw new NotFoundException(
          `Journal with id ${dto.journalId} not found`,
        );
      }

      if (journal.status !== JournalStatus.PENDING) {
        throw new ConflictException(
          `Cannot add entries to journal with status ${journal.status}. Only PENDING journals can be modified.`,
        );
      }

      // 2. get ledgerAccountId with code

      const ledgerAccounts = await this.ledgerAccountRepository.findAll(
        {},
        DBtx,
      );

      if (!ledgerAccounts || ledgerAccounts.length === 0) {
        throw new NotFoundException(`No Ledger Accounts found`);
      }

      const { creditLedgerAccount, debitLedgerAccount } =
        this.specifyLedgerAccounts(dto.allocationType, ledgerAccounts);

      // 2.5 Resolve accountId for denormalization (efficient balance queries)
      const accountId = await this.resolveAccountId(
        dto.targetType,
        dto.targetId,
        DBtx,
      );

      // 3. Create the debit journal entry
      await this.journalEntryRepository.create(
        {
          journalId: dto.journalId,
          ledgerAccountId: debitLedgerAccount.id,
          dc: DebitCredit.DEBIT,
          amount: dto.amount.toString(),
          accountId, // Denormalized for balance queries
        },
        DBtx,
      );
      // 4. Create the credit journal entry
      const creditJournalEntry = await this.journalEntryRepository.create(
        {
          journalId: dto.journalId,
          ledgerAccountId: creditLedgerAccount.id,
          dc: DebitCredit.CREDIT,
          amount: dto.amount.toString(),
          targetType: dto.targetType,
          targetId: dto.targetId,
          accountId, // Denormalized for balance queries
        },
        DBtx,
      );

      // 5. (Optional) link journal entry to target entity

      if (dto.allocationType === AllocationType.LOAN_REPAYMENT) {
        await DBtx.installment.update({
          where: { id: dto.targetId },
          data: {
            journalEntryId: creditJournalEntry.id,
            status: InstallmentStatus.ALLOCATED,
          },
        });
      } else if (dto.allocationType === AllocationType.SUBSCRIPTION_FEE) {
        await DBtx.subscriptionFee.update({
          where: { id: dto.targetId },
          data: {
            journalEntryId: creditJournalEntry.id,
            status: SubscriptionFeeStatus.ALLOCATED,
          },
        });
      }

      // Ensure account 2050 is balanced after new entries
      const isBalanced = await this.verifyAccountBalanced(
        dto.journalId,
        '2050',
        DBtx,
      );

      if (isBalanced) {
        if (journal.transactionId) {
          await DBtx.transaction.update({
            where: { id: journal.transactionId },
            data: { status: TransactionStatus.ALLOCATED },
          });
        }
      }

      // 6. Return updated journal with entries
      return this.findOne(dto.journalId, true);
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  private async verifyAccountBalanced(
    journalId: string,
    accountCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const entries = await this.journalRepository.findByIdWithEntries(
      journalId,
      tx,
    );

    if (!entries) {
      return false;
    }

    const lines: JournalEntry[] = entries.entries ?? [];

    const totalDebitMinor = lines
      .filter(
        (je: JournalEntry) =>
          je.ledgerAccount?.code === accountCode && je.dc === DebitCredit.DEBIT,
      )
      .reduce<bigint>(
        (sum: bigint, je: JournalEntry) => sum + this.toMinorUnits(je.amount),
        0n,
      );

    const totalCreditMinor = lines
      .filter(
        (je: JournalEntry) =>
          je.ledgerAccount?.code === accountCode &&
          je.dc === DebitCredit.CREDIT,
      )
      .reduce<bigint>(
        (sum: bigint, je: JournalEntry) => sum + this.toMinorUnits(je.amount),
        0n,
      );

    return totalDebitMinor === totalCreditMinor;
  }

  // Convert a decimal amount string to integer minor units (scale=4)
  private toMinorUnits(amount: string, scale = 4): bigint {
    const neg = amount.startsWith('-');
    const s = neg ? amount.slice(1) : amount;
    const [intPart, fracPart = ''] = s.split('.');
    const fracPadded = (fracPart + '0'.repeat(scale)).slice(0, scale);
    const bi = BigInt((intPart || '0') + fracPadded);
    return neg ? -bi : bi;
  }

  // Convert integer minor units back to a trimmed decimal string (scale=4)
  private fromMinorUnits(value: bigint, scale = 4): string {
    const neg = value < 0n;
    const abs = neg ? -value : value;
    const s = abs.toString().padStart(scale + 1, '0');
    const intPart = s.slice(0, -scale);
    const fracRaw = s.slice(-scale);
    const fracTrimmed = fracRaw.replace(/0+$/, '');
    const res = fracTrimmed ? `${intPart}.${fracTrimmed}` : intPart;
    return neg ? `-${res}` : res;
  }

  specifyLedgerAccounts(
    allocationType: AllocationType,
    ledgerAccounts: LedgerAccount[],
  ): {
    creditLedgerAccount: LedgerAccount;
    debitLedgerAccount: LedgerAccount;
  } {
    let creditCode = '';
    const debitCode = '2050';
    switch (allocationType) {
      case AllocationType.ACCOUNT_BALANCE:
        creditCode = '2000';
        break;
      case AllocationType.LOAN_REPAYMENT:
        creditCode = '1100';
        break;
      case AllocationType.SUBSCRIPTION_FEE:
        creditCode = '2000';
        break;
      default:
        creditCode = '2000';
    }

    return {
      creditLedgerAccount: ledgerAccounts.find((la) => la.code === creditCode)!,
      debitLedgerAccount: ledgerAccounts.find((la) => la.code === debitCode)!,
    };
  }
}
