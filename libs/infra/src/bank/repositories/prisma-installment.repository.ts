import type { Installment } from '@app/domain';
import { InstallmentRepository } from '@app/domain';
import type {
  CreateInstallmentInput,
  UpdateInstallmentInput,
} from '@app/domain/bank/types/installment.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const installmentSelect: Prisma.InstallmentSelect = {
  id: true,
  code: true,
  installmentNumber: true,
  loanId: true,
  dueDate: true,
  amount: true,
  status: true,
  paymentDate: true,
  createdAt: true,
  updatedAt: true,
};

type InstallmentModel = Prisma.InstallmentGetPayload<{
  select: typeof installmentSelect;
}>;
type InstallmentModelWithRelations = InstallmentModel & {
  loan?: Installment['loan'];
};

function toDomain(
  model: InstallmentModel | InstallmentModelWithRelations,
): Installment {
  const m = model as InstallmentModelWithRelations;
  return {
    id: m.id,
    code: m.code,
    installmentNumber: m.installmentNumber,
    loanId: m.loanId,
    dueDate: m.dueDate,
    amount: m.amount.toString(),
    status: m.status as unknown as Installment['status'],
    paymentDate: m.paymentDate ?? undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    loan: m.loan,
  };
}

@Injectable()
export class PrismaInstallmentRepository implements InstallmentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.InstallmentFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Installment[]> {
    const prisma = tx ?? this.prisma;

    const items = await prisma.installment.findMany(options);
    return items.map((m) => toDomain(m as InstallmentModelWithRelations));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Installment | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.installment.findUnique({
      where: { id },
      select: installmentSelect,
    });
    return model ? toDomain(model as InstallmentModel) : null;
  }

  async count(
    where?: Prisma.InstallmentWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return await prisma.installment.count({ where });
  }

  async create(
    input: CreateInstallmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Installment> {
    const prisma = tx ?? this.prisma;

    const created = await prisma.installment.create({
      data: input,
      select: installmentSelect,
    });
    return toDomain(created as InstallmentModel);
  }

  async update(
    id: string,
    input: UpdateInstallmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Installment> {
    const prisma = tx ?? this.prisma;

    const updated = await prisma.installment.update({
      where: { id },
      data: input,
      select: installmentSelect,
    });
    return toDomain(updated as InstallmentModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.installment.delete({ where: { id } });
  }
}
