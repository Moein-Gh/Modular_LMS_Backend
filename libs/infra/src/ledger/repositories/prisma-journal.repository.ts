import type {
  Account,
  Installment,
  Journal,
  JournalEntry,
  Loan,
  SubscriptionFee,
} from '@app/domain';
import { DebitCredit, JournalRepository } from '@app/domain';
import { JournalEntryTarget } from '@app/domain/ledger/entities/journal-entry.entity';
import type { CreateJournalInput } from '@app/domain/ledger/types/journal.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { type Prisma, type PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const journalSelect = {
  id: true,
  code: true,
  transactionId: true,
  postedAt: true,
  note: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
};

const journalSelectWithEntries = {
  ...journalSelect,
  entries: {
    select: {
      id: true,
      code: true,
      journalId: true,
      ledgerAccountId: true,
      dc: true,
      amount: true,
      targetType: true,
      targetId: true,
      removable: true,
      createdAt: true,
      isDeleted: true,
      ledgerAccount: {
        select: {
          id: true,
          code: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          nameFa: true,
          type: true,
          isDeleted: true,
        },
      },
      // Relations for population
      account: true,
      installments: true,
      subscriptionFees: true,
    },
  },
} as const;

type JournalModel = Prisma.JournalGetPayload<{ select: typeof journalSelect }>;
type JournalModelWithEntries = Prisma.JournalGetPayload<{
  select: typeof journalSelectWithEntries;
}>;
type EntryModel = JournalModelWithEntries['entries'][number];

function toJournalEntry(
  entry: EntryModel,
  loanMap?: Map<string, any>,
): JournalEntry {
  let target: Account | SubscriptionFee | Loan | Installment | undefined =
    undefined;

  if (entry.targetType && entry.targetId) {
    switch (entry.targetType) {
      case JournalEntryTarget.ACCOUNT:
        target = entry.account as Account;
        break;
      case JournalEntryTarget.INSTALLMENT:
        target = entry.installments.find((i) => i.id === entry.targetId) as
          | Installment
          | undefined;
        break;
      case JournalEntryTarget.SUBSCRIPTION_FEE:
        target = entry.subscriptionFees.find((s) => s.id === entry.targetId) as
          | SubscriptionFee
          | undefined;
        break;
      case JournalEntryTarget.LOAN:
        target = loanMap?.get(entry.targetId) as Loan;
        break;
    }
  }

  return {
    id: entry.id,
    code: entry.code,
    journalId: entry.journalId,
    ledgerAccountId: entry.ledgerAccountId,
    dc: entry.dc as DebitCredit,
    amount: entry.amount.toString(),
    targetType: entry.targetType as JournalEntry['targetType'],
    targetId: entry.targetId ?? undefined,
    target,
    removable: entry.removable,
    createdAt: entry.createdAt,
    isDeleted: entry.isDeleted,
    ledgerAccount: entry.ledgerAccount
      ? {
          code: entry.ledgerAccount.code,
          name: entry.ledgerAccount.name,
          nameFa: entry.ledgerAccount.nameFa ?? undefined,
        }
      : undefined,
  };
}

function toJournal(
  model: JournalModel | JournalModelWithEntries,
  loanMap?: Map<string, any>,
): Journal {
  const journal: Journal = {
    id: model.id,
    code: model.code,
    transactionId: model.transactionId ?? undefined,
    postedAt: model.postedAt ?? undefined,
    note: model.note ?? undefined,
    status: model.status as unknown as Journal['status'],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    isDeleted: model.isDeleted,
  };

  if ('entries' in model && model.entries) {
    journal.entries = model.entries.map((e) => toJournalEntry(e, loanMap));
  }

  return journal;
}

@Injectable()
export class PrismaJournalRepository implements JournalRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal | null> {
    const prisma = tx ?? this.prisma;
    const journal = await prisma.journal.findUnique({
      where: { id },
      select: journalSelect,
    });
    if (!journal) return null;

    return toJournal(journal as JournalModel);
  }

  async findByIdWithEntries(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal | null> {
    const prisma = tx ?? this.prisma;
    const journal = await prisma.journal.findUnique({
      where: { id },
      select: {
        ...journalSelectWithEntries,
        entries: {
          select: journalSelectWithEntries.entries.select,
          where: { isDeleted: false },
        },
      },
    });
    if (!journal) return null;

    const loanMap = await this.fetchLoansForJournals(
      [journal as JournalModelWithEntries],
      prisma,
    );
    return toJournal(journal as JournalModelWithEntries, loanMap);
  }

  async update(
    id: string,
    input: Partial<CreateJournalInput>,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal | null> {
    const prisma = tx ?? this.prisma;
    const journal = await prisma.journal.update({
      where: { id },
      data: input,
    });
    return toJournal(journal);
  }

  async updateMany(
    where: Prisma.JournalWhereInput,
    input: Partial<CreateJournalInput>,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    const result = await prisma.journal.updateMany({
      where,
      data: input,
    });
    return result.count;
  }

  async list(
    options?: Prisma.JournalFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal[]> {
    const prisma = tx ?? this.prisma;
    const rows = await prisma.journal.findMany({
      select: journalSelect,
      ...(options ?? {}),
    });
    return rows.map((r) => toJournal(r as JournalModel));
  }

  async findAll(
    options?: Prisma.JournalFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal[]> {
    return this.list(options, tx);
  }

  async findAllWithEntries(
    options?: Prisma.JournalFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal[]> {
    const prisma = tx ?? this.prisma;
    const rows = await prisma.journal.findMany({
      select: {
        ...journalSelectWithEntries,
        entries: {
          select: journalSelectWithEntries.entries.select,
          where: { isDeleted: false },
        },
      },
      ...(options ?? {}),
    });

    const loanMap = await this.fetchLoansForJournals(
      rows as unknown as JournalModelWithEntries[],
      prisma,
    );

    return rows.map((r) => toJournal(r, loanMap));
  }

  private async fetchLoansForJournals(
    journals: JournalModelWithEntries[],
    prisma: PrismaClient | Prisma.TransactionClient,
  ): Promise<Map<string, any>> {
    const loanIds = new Set<string>();
    for (const j of journals) {
      for (const e of j.entries) {
        if (e.targetType === JournalEntryTarget.LOAN && e.targetId) {
          loanIds.add(e.targetId);
        }
      }
    }

    if (loanIds.size === 0) return new Map();

    const loans = await prisma.loan.findMany({
      where: { id: { in: Array.from(loanIds) } },
    });

    return new Map(loans.map((l) => [l.id, l]));
  }

  async count(
    where?: Prisma.JournalWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.journal.count({ where });
  }

  async create(
    input: CreateJournalInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.journal.create({
      data: input,
    });

    return toJournal(created as JournalModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    await prisma.journal.delete({
      where: { id },
    });
  }
}
