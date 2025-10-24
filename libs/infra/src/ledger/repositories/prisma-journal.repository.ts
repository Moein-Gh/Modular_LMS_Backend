import type { Journal, JournalEntry } from '@app/domain';
import { DebitCredit, JournalRepository } from '@app/domain';
import type { CreateJournalInput } from '@app/domain/ledger/types/journal.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const journalSelect = {
  id: true,
  transactionId: true,
  postedAt: true,
  note: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const journalSelectWithEntries = {
  ...journalSelect,
  entries: {
    include: {
      ledgerAccount: true,
    },
  },
} as const;

type JournalModel = Prisma.JournalGetPayload<{ select: typeof journalSelect }>;
type JournalModelWithEntries = Prisma.JournalGetPayload<{
  select: typeof journalSelectWithEntries;
}>;
type EntryModel = JournalModelWithEntries['entries'][number];

function toJournalEntry(entry: EntryModel): JournalEntry {
  return {
    id: entry.id,
    journalId: entry.journalId,
    ledgerAccountId: entry.ledgerAccountId,
    dc: entry.dc as DebitCredit,
    amount: entry.amount.toString(),
    targetType: entry.targetType ?? undefined,
    targetId: entry.targetId ?? undefined,
    createdAt: entry.createdAt,
    ledgerAccount: entry.ledgerAccount
      ? {
          code: entry.ledgerAccount.code,
          name: entry.ledgerAccount.name,
        }
      : undefined,
  };
}

function toJournal(model: JournalModel | JournalModelWithEntries): Journal {
  const journal: Journal = {
    id: model.id,
    transactionId: model.transactionId ?? undefined,
    postedAt: model.postedAt ?? undefined,
    note: model.note ?? undefined,
    status: model.status as unknown as Journal['status'],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };

  if ('entries' in model && model.entries) {
    journal.entries = model.entries.map(toJournalEntry);
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
      select: journalSelectWithEntries,
    });
    if (!journal) return null;

    return toJournal(journal as JournalModelWithEntries);
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
      select: journalSelectWithEntries,
      ...(options ?? {}),
    });
    return rows.map((r) => toJournal(r as JournalModelWithEntries));
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
    await prisma.journal.delete({ where: { id } });
  }
}
