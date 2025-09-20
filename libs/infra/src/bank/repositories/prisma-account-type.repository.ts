import type { AccountType } from '@app/domain';
import { AccountTypeRepository } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const accountTypeSelect: Prisma.AccountTypeSelect = {
  id: true,
  name: true,
  maxAccounts: true,
  createdAt: true,
  updatedAt: true,
};

function toDomain(model: {
  id: string;
  name: string;
  maxAccounts: number | null;
  createdAt: Date;
  updatedAt: Date;
}): AccountType {
  return {
    id: model.id,
    name: model.name,
    maxAccounts: model.maxAccounts,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaAccountTypeRepository implements AccountTypeRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.AccountTypeFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType[]> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.AccountTypeFindManyArgs = {
      ...(include ? { include } : { select: accountTypeSelect }),
      ...rest,
    };
    const items = await prisma.accountType.findMany(args);

    return items.map((m) => toDomain(m));
  }

  async count(
    where?: Prisma.AccountTypeWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return await prisma.accountType.count({ where });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType | null> {
    const prisma = tx ?? this.prisma;
    const accountType = await prisma.accountType.findUnique({
      where: { id },
    });
    if (!accountType) return null;
    return toDomain(accountType);
  }

  // Added: find by name for uniqueness checks
  async findByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType | null> {
    const prisma = tx ?? this.prisma;
    const accountType = await prisma.accountType.findFirst({
      where: { name },
    });
    return accountType ? toDomain(accountType) : null;
  }

  async create(
    input: Pick<AccountType, 'name'>,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.accountType.create({
      data: { name: input.name },
    });
    return toDomain(created);
  }

  async update(
    id: string,
    accountType: Pick<AccountType, 'name'>,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.accountType.update({
      where: { id },
      data: { name: accountType.name },
    });
    return toDomain(updated);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.accountType.delete({ where: { id } });
  }
}
