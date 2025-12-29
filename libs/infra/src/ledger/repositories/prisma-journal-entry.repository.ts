import type {
  CreateJournalEntryInput,
  JournalEntry,
  JournalEntryRepository,
  JournalEntryUpdateManyInput,
  UpdateJournalEntryInput,
} from '@app/domain';

import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const selectJournalEntry = {
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
  accountId: true,
  isDeleted: true,
};

type JournalEntryModel = Prisma.JournalEntryGetPayload<{
  select: typeof selectJournalEntry;
}>;

function toDomain(model: JournalEntryModel): JournalEntry {
  return {
    id: model.id,
    code: model.code,
    journalId: model.journalId,
    ledgerAccountId: model.ledgerAccountId,
    dc: model.dc as unknown as JournalEntry['dc'],
    amount: String(model.amount),
    targetType: model.targetType as JournalEntry['targetType'],
    targetId: model.targetId ?? undefined,
    removable: model.removable,
    createdAt: model.createdAt,
    accountId: model.accountId ?? undefined,
    isDeleted: model.isDeleted,
  };
}

@Injectable()
export class PrismaJournalEntryRepository implements JournalEntryRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.JournalEntryFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalEntry[]> {
    const prisma = tx ?? this.prisma;
    const rows = await prisma.journalEntry.findMany({
      ...(options ?? {}),
    });
    return rows.map((r) => toDomain(r as JournalEntryModel));
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    const row = await prisma.journalEntry.findUnique({
      where: { id },
      select: selectJournalEntry,
    });
    return row ? toDomain(row as JournalEntryModel) : null;
  }

  async count(
    where?: Prisma.JournalEntryWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.journalEntry.count({ where });
  }

  async create(
    input: CreateJournalEntryInput,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalEntry> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.journalEntry.create({
      data: input,
      select: selectJournalEntry,
    });
    return toDomain(created as JournalEntryModel);
  }

  async createMany(
    inputs: CreateJournalEntryInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<JournalEntry[]> {
    const prisma = tx ?? this.prisma;
    const createdEntries = await Promise.all(
      inputs.map((input) =>
        prisma.journalEntry.create({
          data: input,
          select: selectJournalEntry,
        }),
      ),
    );
    return createdEntries.map((entry) => toDomain(entry as JournalEntryModel));
  }

  async update(
    id: string,
    input: UpdateJournalEntryInput,
    tx?: Prisma.TransactionClient,
  ): Promise<JournalEntry> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.journalEntry.update({
      where: { id },
      data: input,
      select: selectJournalEntry,
    });
    return toDomain(updated as JournalEntryModel);
  }

  async updateMany(
    where: Prisma.JournalEntryWhereInput,
    input: JournalEntryUpdateManyInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.journalEntry.updateMany({
      where,
      data: input,
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    await prisma.journalEntry.delete({ where: { id } });
  }
}
