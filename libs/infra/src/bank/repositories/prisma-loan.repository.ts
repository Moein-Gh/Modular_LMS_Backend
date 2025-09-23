import type { Loan } from '@app/domain';
import { LoanRepository } from '@app/domain';
import type {
  CreateLoanInput,
  UpdateLoanInput,
} from '@app/domain/bank/types/loan.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type {
  Prisma,
  PrismaClient,
  LoanStatus as PrismaLoanStatus,
} from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const loanSelect: Prisma.LoanSelect = {
  id: true,
  name: true,
  accountId: true,
  loanTypeId: true,
  amount: true,
  startDate: true,
  paymentMonths: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type LoanModel = Prisma.LoanGetPayload<{ select: typeof loanSelect }>;
type LoanModelWithRelations = LoanModel & {
  account?: Loan['account'];
  loanType?: Loan['loanType'];
};

function toDomain(model: LoanModel | LoanModelWithRelations): Loan {
  // Allow being called with scalar-only selects or with included relations
  const m = model as LoanModelWithRelations;
  return {
    id: m.id,
    name: m.name,
    accountId: m.accountId,
    loanTypeId: m.loanTypeId,
    amount: m.amount.toString(),
    startDate: m.startDate,
    paymentMonths: m.paymentMonths,
    status: m.status as unknown as Loan['status'],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    account: m.account,
    loanType: m.loanType,
  };
}

@Injectable()
export class PrismaLoanRepository implements LoanRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.LoanFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan[]> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.LoanFindManyArgs = {
      ...(include ? { include } : { select: loanSelect }),
      ...rest,
    };
    const items = await prisma.loan.findMany(args);
    return items.map((m) => toDomain(m as LoanModelWithRelations));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.loan.findUnique({
      where: { id },
      select: loanSelect,
    });
    return model ? toDomain(model as LoanModel) : null;
  }

  async count(
    where?: Prisma.LoanWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.loan.count({ where });
  }

  async create(
    input: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const prisma = tx ?? this.prisma;
    const data: Prisma.LoanCreateInput = {
      name: input.name,
      amount: input.amount,
      startDate: input.startDate,
      paymentMonths: input.paymentMonths,
      status: (input.status as unknown as PrismaLoanStatus) ?? undefined,
      account: { connect: { id: input.accountId } },
      loanType: { connect: { id: input.loanTypeId } },
    };
    const created = await prisma.loan.create({
      data,
      select: loanSelect,
    });
    return toDomain(created as LoanModel);
  }

  async update(
    id: string,
    input: UpdateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const prisma = tx ?? this.prisma;
    const data: Prisma.LoanUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.paymentMonths !== undefined
        ? { paymentMonths: input.paymentMonths }
        : {}),
      ...(input.status !== undefined
        ? { status: input.status as unknown as PrismaLoanStatus }
        : {}),
      ...(input.accountId !== undefined
        ? { account: { connect: { id: input.accountId } } }
        : {}),
      ...(input.loanTypeId !== undefined
        ? { loanType: { connect: { id: input.loanTypeId } } }
        : {}),
    };
    const updated = await prisma.loan.update({
      where: { id },
      data,
      select: loanSelect,
    });
    return toDomain(updated as LoanModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.loan.delete({ where: { id } });
  }
}
