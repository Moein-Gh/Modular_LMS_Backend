import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Bank } from '@app/domain';
import type {
  CreateBankInput,
  UpdateBankInput,
} from '@app/domain/bank/types/bank.type';

const bankSelect: Prisma.BankSelect = {
  id: true,
  name: true,
  subscriptionFee: true,
  commissionPercentage: true,
  defaultMaxInstallments: true,
  installmentOptions: true,
  status: true,
  currency: true,
  timeZone: true,
  accountId: true,
  createdAt: true,
  updatedAt: true,
};

type BankModel = Prisma.BankGetPayload<{ select: typeof bankSelect }>;

function toDomain(model: BankModel): Bank {
  return {
    id: model.id,
    name: model.name,
    subscriptionFee: model.subscriptionFee.toString(),
    commissionPercentage: model.commissionPercentage.toString(),
    defaultMaxInstallments: model.defaultMaxInstallments,
    installmentOptions: model.installmentOptions,
    status: model.status,
    currency: model.currency,
    timeZone: model.timeZone,
    accountId: model.accountId ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaBankRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findOne(tx?: Prisma.TransactionClient): Promise<Bank | null> {
    const prisma = tx ?? this.prisma;
    const row = await prisma.bank.findFirst({ select: bankSelect });
    return row ? toDomain(row) : null;
  }

  async create(
    input: CreateBankInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Bank> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.bank.create({
      data: {
        name: input.name,
        subscriptionFee: input.subscriptionFee,
        commissionPercentage: input.commissionPercentage,
        defaultMaxInstallments: input.defaultMaxInstallments,
        installmentOptions: input.installmentOptions,
        status: input.status,
        currency: input.currency,
        timeZone: input.timeZone,
        ...(input.accountId ? { accountId: input.accountId } : {}),
      },
      select: bankSelect,
    });
    return toDomain(created);
  }

  async update(
    id: string,
    input: UpdateBankInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Bank> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.bank.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.subscriptionFee !== undefined && {
          subscriptionFee: input.subscriptionFee,
        }),
        ...(input.commissionPercentage !== undefined && {
          commissionPercentage: input.commissionPercentage,
        }),
        ...(input.defaultMaxInstallments !== undefined && {
          defaultMaxInstallments: input.defaultMaxInstallments,
        }),
        ...(input.installmentOptions !== undefined && {
          installmentOptions: input.installmentOptions,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.timeZone !== undefined && { timeZone: input.timeZone }),
        ...(input.accountId !== undefined && { accountId: input.accountId }),
      },
      select: bankSelect,
    });
    return toDomain(updated);
  }
}
