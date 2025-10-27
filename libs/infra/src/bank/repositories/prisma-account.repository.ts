import type { Account } from '@app/domain';
import {
  AccountRepository,
  CreateAccountInput,
  UpdateAccountInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const accountSelect: Prisma.AccountSelect = {
  id: true,
  code: true,
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
type AccountModelWithRelations = AccountModel & {
  user?: Account['user'];
  accountType?: Account['accountType'];
};

function toDomain(model: AccountModelWithRelations): Account {
  return {
    id: model.id,
    code: model.code,
    accountTypeId: model.accountTypeId,
    name: model.name,
    userId: model.userId,
    cardNumber: model.cardNumber,
    bankName: model.bankName,
    status: model.status as unknown as Account['status'],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    user: model.user,
    accountType: model.accountType,
  };
}

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.AccountFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]> {
    const prisma = tx ?? this.prisma;
    const { include, ...rest } = options ?? {};
    const args: Prisma.AccountFindManyArgs = {
      ...(include ? { include } : { select: accountSelect }),
      ...rest,
    };
    const items = await prisma.account.findMany(args);

    return items.map((m) => toDomain(m as AccountModelWithRelations));
  }

  async findById(
    id: string,
    options?: { includeUser?: boolean },
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null> {
    const prisma = tx ?? this.prisma;
    const queryOptions: Prisma.AccountFindUniqueArgs = {
      where: { id },
      ...(options?.includeUser
        ? { include: { user: true } }
        : { select: accountSelect }),
    };
    const model = await prisma.account.findUnique(queryOptions);
    return model ? toDomain(model as AccountModelWithRelations) : null;
  }

  async count(
    where?: Prisma.AccountWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.account.count({ where });
  }

  async findUnique(
    options: Prisma.AccountFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null> {
    const prisma = tx ?? this.prisma;

    const model = await prisma.account.findUnique(options);
    return model ? toDomain(model as AccountModelWithRelations) : null;
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]> {
    return this.findAll({ where: { userId } }, tx);
  }

  async create(
    input: CreateAccountInput & { name: string },
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.account.create({
      data: input,
      select: accountSelect,
    });
    return toDomain(created as AccountModel);
  }

  async update(
    id: string,
    input: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.account.update({
      where: { id },
      data: input,
      select: accountSelect,
    });
    return toDomain(updated as AccountModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.account.delete({ where: { id } });
  }
}
