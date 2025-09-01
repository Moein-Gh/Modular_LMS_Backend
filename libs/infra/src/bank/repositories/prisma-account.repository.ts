import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient, Prisma } from '@generated/prisma';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Account } from '@app/domain';
import { AccountRepository } from '@app/domain';
import {
  CreateAccountInput,
  UpdateAccountInput,
} from '@app/domain/bank/types/account.type';

const accountSelect: Prisma.AccountSelect = {
  id: true,
  accountTypeId: true,
  name: true,
  userId: true,
  cardNumber: true,
  bankName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type AccountModel = Prisma.AccountGetPayload<{ select: typeof accountSelect }>;

function toDomain(model: AccountModel): Account {
  return {
    id: model.id,
    accountTypeId: model.accountTypeId,
    name: model.name,
    userId: model.userId,
    cardNumber: model.cardNumber,
    bankName: model.bankName as unknown as Account['bankName'],
    status: model.status as unknown as Account['status'],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(tx?: Prisma.TransactionClient): Promise<Account[]> {
    const prisma = tx ?? this.prisma;
    const items = await prisma.account.findMany({ select: accountSelect });
    return items.map((m) => toDomain(m as AccountModel));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.account.findUnique({
      where: { id },
      select: accountSelect,
    });
    return model ? toDomain(model as AccountModel) : null;
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]> {
    const prisma = tx ?? this.prisma;
    const items = await prisma.account.findMany({
      where: { userId },
      select: accountSelect,
    });
    return items.map((m) => toDomain(m as AccountModel));
  }

  async create(
    account: CreateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.account.create({
      data: {
        accountTypeId: account.accountTypeId,
        name: account.name,
        userId: account.userId,
        cardNumber: account.cardNumber,
        bankName: account.bankName,
      },
      select: accountSelect,
    });
    return toDomain(created as AccountModel);
  }

  async update(
    id: string,
    account: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const prisma = tx ?? this.prisma;
    const existingAccount = await prisma.account.findUnique({ where: { id } });
    if (!existingAccount) {
      throw new Error('Account not found');
    }
    Object.assign(existingAccount, account);
    const updated = await prisma.account.update({
      where: { id },
      data: existingAccount,
    });
    return toDomain(updated as AccountModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.account.delete({ where: { id } });
  }
}
