import { NotFoundError } from '@app/application';
import type { LoanQueue } from '@app/domain';
import { LoanQueueRepository } from '@app/domain';
import type {
  CreateLoanQueueInput,
  UpdateLoanQueueInput,
} from '@app/domain/bank/types/loan-request.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const loanQueueSelect: Prisma.LoanQueueSelect = {
  id: true,
  code: true,
  loanRequestId: true,
  queueOrder: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  deletedBy: true,
};

type LoanQueueModel = Prisma.LoanQueueGetPayload<{
  select: typeof loanQueueSelect;
}>;

type LoanQueueModelWithRelations = LoanQueueModel & {
  loanRequest?: LoanQueue['loanRequest'];
};

function toDomain(
  model: LoanQueueModel | LoanQueueModelWithRelations,
): LoanQueue {
  const m = model as LoanQueueModelWithRelations;
  return {
    id: m.id,
    code: m.code,
    loanRequestId: m.loanRequestId,
    queueOrder: m.queueOrder,
    adminNotes: m.adminNotes ?? undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    isDeleted: m.isDeleted,
    deletedAt: m.deletedAt ?? undefined,
    deletedBy: m.deletedBy ?? undefined,
    loanRequest: m.loanRequest,
  };
}

@Injectable()
export class PrismaLoanQueueRepository implements LoanQueueRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.LoanQueueFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue[]> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.LoanQueueFindManyArgs = {
      ...(include ? { include } : { select: loanQueueSelect }),
      ...rest,
    };
    const items = await prisma.loanQueue.findMany(args);
    return items.map((m) => toDomain(m as LoanQueueModelWithRelations));
  }

  async findOne(
    options: Prisma.LoanQueueFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue | null> {
    const prisma = tx ?? this.prisma;
    const where = {
      ...(options?.where ?? {}),
    } as Prisma.LoanQueueWhereUniqueInput;
    if (where.isDeleted === undefined) {
      where.isDeleted = false;
    }
    const model = await prisma.loanQueue.findUnique({
      ...options,
      where,
    });
    return model ? toDomain(model as LoanQueueModel) : null;
  }

  async findByLoanRequestId(
    loanRequestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue | null> {
    return this.findOne({ where: { loanRequestId, isDeleted: false } }, tx);
  }

  async create(
    input: CreateLoanQueueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    const prisma = tx ?? this.prisma;
    const data: Prisma.LoanQueueCreateInput = {
      queueOrder: input.queueOrder,
      adminNotes: input.adminNotes,
      loanRequest: { connect: { id: input.loanRequestId } },
    };
    const created = await prisma.loanQueue.create({
      data,
      select: loanQueueSelect,
    });
    return toDomain(created as LoanQueueModel);
  }

  async update(
    id: string,
    input: UpdateLoanQueueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    const prisma = tx ?? this.prisma;
    const data: Prisma.LoanQueueUpdateInput = {
      ...(input.queueOrder !== undefined
        ? { queueOrder: input.queueOrder }
        : {}),
      ...(input.adminNotes !== undefined
        ? { adminNotes: input.adminNotes }
        : {}),
    };
    const updated = await prisma.loanQueue.update({
      where: { isDeleted: false, id },
      data,
      select: loanQueueSelect,
    });
    return toDomain(updated as LoanQueueModel);
  }

  async updateOrder(
    id: string,
    newOrder: number,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    const prisma = tx ?? this.prisma;

    // Get current item
    const currentItem = await prisma.loanQueue.findUnique({
      where: { id, isDeleted: false },
    });

    if (!currentItem) {
      throw new NotFoundError('LoanQueue', 'id', id);
    }

    const oldOrder = currentItem.queueOrder;

    // If moving down (increasing order number)
    if (newOrder > oldOrder) {
      // Shift items between old and new position up
      await prisma.loanQueue.updateMany({
        where: {
          isDeleted: false,
          queueOrder: {
            gt: oldOrder,
            lte: newOrder,
          },
        },
        data: {
          queueOrder: {
            decrement: 1,
          },
        },
      });
    }
    // If moving up (decreasing order number)
    else if (newOrder < oldOrder) {
      // Shift items between new and old position down
      await prisma.loanQueue.updateMany({
        where: {
          isDeleted: false,
          queueOrder: {
            gte: newOrder,
            lt: oldOrder,
          },
        },
        data: {
          queueOrder: {
            increment: 1,
          },
        },
      });
    }

    // Update the target item
    const updated = await prisma.loanQueue.update({
      where: { id, isDeleted: false },
      data: { queueOrder: newOrder },
      select: loanQueueSelect,
    });

    return toDomain(updated as LoanQueueModel);
  }

  async reorderQueue(tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;

    // Get all queue items ordered by current order
    const items = await prisma.loanQueue.findMany({
      where: { isDeleted: false },
      orderBy: { queueOrder: 'asc' },
    });

    // Reorder sequentially
    for (let i = 0; i < items.length; i++) {
      await prisma.loanQueue.update({
        where: { id: items[i].id },
        data: { queueOrder: i + 1 },
      });
    }
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.loanQueue.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('LoanQueue', 'id', id);
    }
    await prisma.loanQueue.update({
      where: { isDeleted: false, id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
    // Reorder remaining items
    await this.reorderQueue(tx);
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.loanQueue.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('LoanQueue', 'id', id);
    }
    if (!existing.isDeleted) {
      return;
    }
    await prisma.loanQueue.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async removeFromQueue(
    loanRequestId: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const queueItem = await prisma.loanQueue.findUnique({
      where: { loanRequestId, isDeleted: false },
    });
    if (queueItem) {
      await this.softDelete(queueItem.id, currentUserId, tx);
    }
  }
}
