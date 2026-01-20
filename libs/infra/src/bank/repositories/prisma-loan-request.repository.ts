import { NotFoundError } from '@app/application';
import type { LoanRequest } from '@app/domain';
import { LoanRequestRepository } from '@app/domain';
import type {
  CreateLoanRequestInput,
  UpdateLoanRequestInput,
} from '@app/domain/bank/types/loan-request.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type {
  Prisma,
  PrismaClient,
  LoanRequestStatus as PrismaLoanRequestStatus,
} from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const loanRequestSelect: Prisma.LoanRequestSelect = {
  id: true,
  code: true,
  accountId: true,
  loanTypeId: true,
  userId: true,
  amount: true,
  startDate: true,
  paymentMonths: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  deletedBy: true,
  ownerId: true,
  createdBy: true,
};

type LoanRequestModel = Prisma.LoanRequestGetPayload<{
  select: typeof loanRequestSelect;
}>;

type LoanRequestModelWithRelations = LoanRequestModel & {
  account?: LoanRequest['account'];
  loanType?: LoanRequest['loanType'];
  user?: LoanRequest['user'];
  loanQueue?: LoanRequest['loanQueue'];
};

function toDomain(
  model: LoanRequestModel | LoanRequestModelWithRelations,
): LoanRequest {
  const m = model as LoanRequestModelWithRelations;
  return {
    id: m.id,
    code: m.code,
    accountId: m.accountId,
    loanTypeId: m.loanTypeId,
    userId: m.userId,
    amount: m.amount.toString(),
    startDate: m.startDate,
    paymentMonths: m.paymentMonths,
    status: m.status as unknown as LoanRequest['status'],
    note: m.note ?? undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    isDeleted: m.isDeleted,
    deletedAt: m.deletedAt ?? undefined,
    deletedBy: m.deletedBy ?? undefined,
    ownerId: m.ownerId ?? undefined,
    createdBy: m.createdBy ?? undefined,
    account: m.account,
    loanType: m.loanType,
    user: m.user,
    loanQueue: m.loanQueue,
  };
}

@Injectable()
export class PrismaLoanRequestRepository implements LoanRequestRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.LoanRequestFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest[]> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.LoanRequestFindManyArgs = {
      ...(include ? { include } : { select: loanRequestSelect }),
      ...rest,
    };
    const items = await prisma.loanRequest.findMany(args);
    return items.map((m) => toDomain(m as LoanRequestModelWithRelations));
  }

  async findOne(
    options: Prisma.LoanRequestFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest | null> {
    const prisma = tx ?? this.prisma;
    const where = {
      ...(options?.where ?? {}),
    } as Prisma.LoanRequestWhereUniqueInput;
    if (where.isDeleted === undefined) {
      where.isDeleted = false;
    }
    const model = await prisma.loanRequest.findUnique({
      ...options,
      where,
    });
    return model ? toDomain(model as LoanRequestModel) : null;
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest | null> {
    return this.findOne({ where: { id, isDeleted: false } }, tx);
  }

  async count(
    where?: Prisma.LoanRequestWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.loanRequest.count({ where: { isDeleted: false, ...where } });
  }

  async create(
    input: CreateLoanRequestInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    const prisma = tx ?? this.prisma;
    const data: Prisma.LoanRequestCreateInput = {
      amount: input.amount,
      startDate: input.startDate,
      paymentMonths: input.paymentMonths,
      note: input.note,
      account: { connect: { id: input.accountId } },
      loanType: { connect: { id: input.loanTypeId } },
      user: { connect: { id: input.userId } },
    };
    const created = await prisma.loanRequest.create({
      data,
      select: loanRequestSelect,
    });
    return toDomain(created as LoanRequestModel);
  }

  async update(
    id: string,
    input: UpdateLoanRequestInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    const prisma = tx ?? this.prisma;
    const data: Prisma.LoanRequestUpdateInput = {
      ...(input.status !== undefined
        ? { status: input.status as unknown as PrismaLoanRequestStatus }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    };
    const updated = await prisma.loanRequest.update({
      where: { isDeleted: false, id },
      data,
      select: loanRequestSelect,
    });
    return toDomain(updated as LoanRequestModel);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.loanRequest.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }
    await prisma.loanRequest.update({
      where: { isDeleted: false, id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.loanRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }
    if (!existing.isDeleted) {
      return;
    }
    await prisma.loanRequest.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}
