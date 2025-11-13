import type {
  CreateTransactionInput,
  Transaction,
  TransactionRepository,
  UpdateTransactionInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma, type PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const selectTransaction = {
  id: true,
  code: true,
  kind: true,
  amount: true,
  status: true,
  externalRef: true,
  note: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

const selectTransactionWithRelations = {
  id: true,
  code: true,
  kind: true,
  amount: true,
  status: true,
  externalRef: true,
  note: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      code: true,
      identityId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      identity: true,
    },
  },
  images: {
    include: {
      file: true,
    },
  },
};

type TransactionModel = Prisma.TransactionGetPayload<{
  select: typeof selectTransaction;
}>;

type TransactionWithRelationsModel = Prisma.TransactionGetPayload<{
  select: typeof selectTransactionWithRelations;
}>;

// Base mapping function for common fields
function mapTransactionBase(
  model: TransactionModel | TransactionWithRelationsModel,
): Omit<Transaction, 'user' | 'images'> {
  return {
    id: model.id,
    code: model.code,
    kind: model.kind as unknown as Transaction['kind'],
    amount: String(model.amount),
    status: model.status as unknown as Transaction['status'],
    externalRef: model.externalRef ?? undefined,
    note: model.note ?? undefined,
    userId: model.userId,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

function toDomain(model: TransactionModel): Transaction {
  return {
    ...mapTransactionBase(model),
    images: [], // Empty array for basic transactions
  };
}

function toDomainWithRelations(
  model: TransactionWithRelationsModel,
): Transaction {
  const result: Transaction = {
    ...mapTransactionBase(model),
    images: model.images ?? [],
  };

  // Add user with complete identity if available
  if (model.user) {
    result.user = {
      id: model.user.id,
      code: model.user.code,
      identityId: model.user.identityId,
      isActive: model.user.isActive,
      identity: model.user.identity,
    };
  }

  return result;
}

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.TransactionFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction[]> {
    const prisma = tx ?? this.prisma;
    const args: Prisma.TransactionFindManyArgs = {
      ...(options ?? {}),
      // Only add select if include is not provided
      ...(!options?.include && { select: selectTransactionWithRelations }),
    };
    const transactions = await prisma.transaction.findMany(args);
    return transactions.map((t) =>
      toDomainWithRelations(t as TransactionWithRelationsModel),
    );
  }

  async count(
    where?: Prisma.TransactionWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.transaction.count({ where: where });
  }

  async update(
    id: string,
    input: UpdateTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const prisma = tx ?? this.prisma;

    const updated = await prisma.transaction.update({
      where: { id },
      data: input,
      select: selectTransaction,
    });
    return toDomain(updated as TransactionModel);
  }

  async create(
    input: CreateTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const prisma = tx ?? this.prisma;

    const transaction = await prisma.transaction.create({
      data: input,
      select: selectTransaction,
    });

    return toDomain(transaction as TransactionModel);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const prisma = tx ?? this.prisma;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: selectTransaction,
    });
    if (!transaction) return null;
    return toDomain(transaction as TransactionModel);
  }

  async findByIdWithRelations(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const prisma = tx ?? this.prisma;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: selectTransactionWithRelations,
    });
    if (!transaction) return null;
    return toDomainWithRelations(transaction as TransactionWithRelationsModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.transaction.delete({ where: { id } });
  }
}
