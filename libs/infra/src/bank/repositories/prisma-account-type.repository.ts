import { NotFoundError } from '@app/application';
import type {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '@app/domain';
import { AccountTypeRepository } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const accountTypeSelect: Prisma.AccountTypeSelect = {
  id: true,
  code: true,
  name: true,
  maxAccounts: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  deletedBy: true,
};

type AccountTypeModel = Prisma.AccountTypeGetPayload<{
  select: typeof accountTypeSelect;
}>;

function toDomain(model: AccountTypeModel): AccountType {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    maxAccounts: model.maxAccounts,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    isDeleted: model.isDeleted,
    deletedAt: model.deletedAt ?? undefined,
    deletedBy: model.deletedBy ?? undefined,
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
    const { include, where, ...rest } = options ?? {};
    const args: Prisma.AccountTypeFindManyArgs = {
      ...(include ? { include } : { select: accountTypeSelect }),
      where: { isDeleted: false, ...(where as object) },
      ...rest,
    };
    const items = await prisma.accountType.findMany(args);
    return items.map((m) => toDomain(m as AccountTypeModel));
  }

  async count(
    where?: Prisma.AccountTypeWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return await prisma.accountType.count({
      where: { isDeleted: false, ...where },
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType | null> {
    const prisma = tx ?? this.prisma;
    const accountType = await prisma.accountType.findUnique({
      where: { id, isDeleted: false },
      select: accountTypeSelect,
    });
    if (!accountType) return null;
    return toDomain(accountType as AccountTypeModel);
  }

  async findByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType | null> {
    const prisma = tx ?? this.prisma;
    const accountType = await prisma.accountType.findFirst({
      where: { name, isDeleted: false },
      select: accountTypeSelect,
    });
    return accountType ? toDomain(accountType as AccountTypeModel) : null;
  }

  async create(
    input: CreateAccountTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.accountType.create({
      data: input,
      select: accountTypeSelect,
    });
    return toDomain(created as AccountTypeModel);
  }

  async update(
    id: string,
    accountType: UpdateAccountTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.accountType.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('AccountType', 'id', id);
    }
    const updated = await prisma.accountType.update({
      where: { isDeleted: false, id },
      data: accountType,
      select: accountTypeSelect,
    });
    return toDomain(updated as AccountTypeModel);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.accountType.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('AccountType', 'id', id);
    }
    await prisma.accountType.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
  }
}
