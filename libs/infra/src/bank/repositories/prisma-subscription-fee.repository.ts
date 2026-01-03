import { NotFoundError } from '@app/application';
import type { SubscriptionFee } from '@app/domain';
import { SubscriptionFeeRepository } from '@app/domain';
import type { UpdateSubscriptionFeeInput } from '@app/domain/bank/types/subscription-fee.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaSubscriptionFeeCreateInput } from '../dtos/prisma-subscription-fee.dto.repository';

const subscriptionFeeSelect: Prisma.SubscriptionFeeSelect = {
  id: true,
  code: true,
  accountId: true,
  journalEntryId: true,
  periodStart: true,
  amount: true,
  status: true,
  dueDate: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
};

type SubscriptionFeeModel = Prisma.SubscriptionFeeGetPayload<{
  select: typeof subscriptionFeeSelect;
}>;
type SubscriptionFeeModelWithRelations = SubscriptionFeeModel & {
  account?: SubscriptionFee['account'];
  journalEntry?: SubscriptionFee['journalEntry'];
};

function toDomain(
  model: SubscriptionFeeModel | SubscriptionFeeModelWithRelations,
): SubscriptionFee {
  const m = model as SubscriptionFeeModelWithRelations;
  return {
    id: m.id,
    code: m.code,
    accountId: m.accountId,
    journalEntryId: m.journalEntryId ?? undefined,
    periodStart: m.periodStart,
    amount: m.amount.toString(),
    status: m.status as unknown as SubscriptionFee['status'],
    dueDate: m.dueDate ?? undefined,
    paidAt: m.paidAt ?? undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    account: m.account,
    journalEntry: m.journalEntry,
    isDeleted: m.isDeleted,
    deletedAt: m.deletedAt ?? undefined,
    deletedBy: m.deletedBy ?? undefined,
  };
}

@Injectable()
export class PrismaSubscriptionFeeRepository
  implements SubscriptionFeeRepository
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.SubscriptionFeeFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee[]> {
    const prisma = tx ?? this.prisma;
    const { include, where, ...rest } = options ?? {};
    const args: Prisma.SubscriptionFeeFindManyArgs = {
      ...(include ? { include } : { select: subscriptionFeeSelect }),
      where: { isDeleted: false, ...(where as object) },
      ...rest,
    };
    const items = await prisma.subscriptionFee.findMany(args);
    return items.map((m) => toDomain(m as SubscriptionFeeModelWithRelations));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.subscriptionFee.findUnique({
      where: { id, isDeleted: false },
      select: subscriptionFeeSelect,
    });
    return model ? toDomain(model as SubscriptionFeeModel) : null;
  }

  async count(
    where?: Prisma.SubscriptionFeeWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return await prisma.subscriptionFee.count({
      where: { isDeleted: false, ...where },
    });
  }

  async create(
    input: PrismaSubscriptionFeeCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.subscriptionFee.create({
      data: input,
      select: subscriptionFeeSelect,
    });
    return toDomain(created as SubscriptionFeeModel);
  }

  async update(
    id: string,
    input: UpdateSubscriptionFeeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.subscriptionFee.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('SubscriptionFee', 'id', id);
    }
    const updated = await prisma.subscriptionFee.update({
      where: { isDeleted: false, id },
      data: input as Prisma.SubscriptionFeeUpdateInput,
      select: subscriptionFeeSelect,
    });
    return toDomain(updated as SubscriptionFeeModel);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.subscriptionFee.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('SubscriptionFee', 'id', id);
    }
    await prisma.subscriptionFee.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
  }

  async softDeleteMany(
    where: Prisma.SubscriptionFeeWhereInput,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.subscriptionFee.updateMany({
      where,
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
  }
}
