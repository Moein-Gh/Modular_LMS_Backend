import type { LoanType } from '@app/domain';
import {
  CreateLoanTypeInput,
  LoanTypeRepository,
  UpdateLoanTypeInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const loanTypeSelect: Prisma.LoanTypeSelect = {
  id: true,
  code: true,
  name: true,
  commissionPercentage: true,
  defaultInstallments: true,
  maxInstallments: true,
  minInstallments: true,
  creditRequirementPct: true,
  description: true,
  createdAt: true,
  updatedAt: true,
};

type LoanTypeModel = Prisma.LoanTypeGetPayload<{
  select: typeof loanTypeSelect;
}>;
function toDomain(model: LoanTypeModel): LoanType {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    commissionPercentage: model.commissionPercentage,
    defaultInstallments: model.defaultInstallments,
    maxInstallments: model.maxInstallments,
    minInstallments: model.minInstallments,
    creditRequirementPct: model.creditRequirementPct,
    description: model.description ?? null,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaLoanTypeRepository implements LoanTypeRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.LoanTypeFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType[]> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.LoanTypeFindManyArgs = {
      ...(include ? { include } : { select: loanTypeSelect }),
      ...rest,
    };
    const items = await prisma.loanType.findMany(args);
    return items.map((m) => toDomain(m as LoanTypeModel));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.loanType.findUnique({
      where: { id },
      select: loanTypeSelect,
    });
    return model ? toDomain(model as LoanTypeModel) : null;
  }

  async count(
    where?: Prisma.LoanTypeWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.loanType.count({ where });
  }

  async findUnique(
    options: Prisma.LoanTypeFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType | null> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.LoanTypeFindUniqueArgs = {
      ...(include ? { include } : { select: loanTypeSelect }),
      ...rest,
    };
    const model = await prisma.loanType.findUnique(args);
    return model ? toDomain(model as LoanTypeModel) : null;
  }

  async create(
    input: CreateLoanTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.loanType.create({
      data: input,
      select: loanTypeSelect,
    });
    return toDomain(created as LoanTypeModel);
  }

  async update(
    id: string,
    input: UpdateLoanTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.loanType.update({
      where: { id },
      data: input,
      select: loanTypeSelect,
    });
    return toDomain(updated as LoanTypeModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.loanType.delete({ where: { id } });
  }
}
