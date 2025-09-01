import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient, Prisma } from '@generated/prisma';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { AccountType } from '@app/domain';
import { AccountTypeRepository } from '@app/domain';

@Injectable()
export class PrismaAccountTypeRepository implements AccountTypeRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(tx?: Prisma.TransactionClient): Promise<AccountType[]> {
    const prisma = tx ?? this.prisma;
    return await prisma.accountType.findMany();
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
    return accountType;
  }

  async create(
    input: Pick<AccountType, 'name'>,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const prisma = tx ?? this.prisma;
    return await prisma.accountType.create({
      data: { name: input.name },
    });
  }

  async update(
    id: string,
    accountType: Pick<AccountType, 'name'>,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const prisma = tx ?? this.prisma;
    return await prisma.accountType.update({
      where: { id },
      data: { name: accountType.name },
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.accountType.delete({ where: { id } });
  }
}
