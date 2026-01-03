import { NotFoundError } from '@app/application';
import type {
  CreateTransactionInput,
  Identity,
  Transaction,
  TransactionRepository,
  UpdateTransactionInput,
  UserStatus,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
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
  isDeleted: true,
  images: {
    include: {
      file: true,
    },
  },
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
  isDeleted: true,
  user: {
    select: {
      id: true,
      code: true,
      identityId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      identity: true,
      isDeleted: true,
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
    isDeleted: model.isDeleted,
  };
}

function toDomain(model: TransactionModel): Transaction {
  return {
    ...mapTransactionBase(model),
    images: model.images ?? [],
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
      status: model.user.status as UserStatus,
      identity: model.user.identity as Identity,
      isDeleted: model.user.isDeleted,
    };
  }

  return result;
}

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClient,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

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
    return transactions.map((t) => {
      if (typeof t === 'object' && t !== null && 'user' in t) {
        const m = t as unknown as TransactionWithRelationsModel;
        if (m.user) return toDomainWithRelations(m);
      }
      return toDomain(t as unknown as TransactionModel);
    });
  }

  async count(
    where?: Prisma.TransactionWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.transaction.count({ where: { isDeleted: false, ...where } });
  }

  async update(
    id: string,
    input: UpdateTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Transaction', 'id', id);
    }

    const updated = await prisma.transaction.update({
      where: { isDeleted: false, id },
      data: input,
      select: selectTransaction,
    });
    return toDomain(updated as unknown as TransactionModel);
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

    return toDomain(transaction as unknown as TransactionModel);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction | null> {
    const prisma = tx ?? this.prisma;
    const transaction = await prisma.transaction.findUnique({
      where: { id, isDeleted: false },
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
      where: { id, isDeleted: false },
      select: selectTransactionWithRelations,
    });
    if (!transaction) return null;
    return toDomainWithRelations(
      transaction as unknown as TransactionWithRelationsModel,
    );
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const existing = await DBtx.transaction.findUnique({
        where: { isDeleted: false, id },
      });
      if (!existing) {
        throw new NotFoundError('Transaction', 'id', id);
      }

      await DBtx.journal.updateMany({
        where: { isDeleted: false, transactionId: id },
        data: {
          isDeleted: true,
          deletedBy: currentUserId,
          deletedAt: new Date(),
        },
      });
      await DBtx.transaction.update({
        where: { isDeleted: false, id },
        data: {
          isDeleted: true,
          deletedBy: currentUserId,
          deletedAt: new Date(),
        },
      });
    };

    if (tx) return run(tx);
    return this.prismaTransactionalRepo.withTransaction(run);
  }
}
