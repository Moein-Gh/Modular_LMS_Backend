import type { Journal } from '@app/domain';
import { JournalRepository } from '@app/domain';
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

type JournalModel = Prisma.JournalGetPayload<{ select: typeof journalSelect }>;

function toJournal(model: JournalModel): Journal {
  return {
    id: model.id,
    transactionId: model.transactionId ?? undefined,
    postedAt: model.postedAt ?? undefined,
    note: model.note ?? undefined,
    status: model.status as unknown as Journal['status'],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
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
