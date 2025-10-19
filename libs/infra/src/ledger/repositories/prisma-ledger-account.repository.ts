import type { LedgerAccount } from '@app/domain';
import { LedgerAccountRepository } from '@app/domain';
import type {
  CreateLedgerAccountInput,
  UpdateLedgerAccountInput,
} from '@app/domain/ledger/types/ledger-account.type';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const selectLedgerAccount: Prisma.LedgerAccountSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

type LedgerAccountModel = Prisma.LedgerAccountGetPayload<{
  select: typeof selectLedgerAccount;
}>;

function toDomain(model: LedgerAccountModel): LedgerAccount {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    type: model.type as unknown as LedgerAccount['type'],
    status: model.status as unknown as LedgerAccount['status'],
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaLedgerAccountRepository implements LedgerAccountRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.LedgerAccountFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerAccount[]> {
    const prisma = tx ?? this.prisma;
    const rows = await prisma.ledgerAccount.findMany({
      select: selectLedgerAccount,
      ...(options ?? {}),
    });
    return rows.map((r) => toDomain(r as LedgerAccountModel));
  }

  async count(
    where?: Prisma.LedgerAccountWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.ledgerAccount.count({ where });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    const row = await prisma.ledgerAccount.findUnique({
      where: { id },
      select: selectLedgerAccount,
    });
    return row ? toDomain(row as LedgerAccountModel) : null;
  }

  async findByCode(code: string, tx?: Prisma.TransactionClient) {
    const prisma = tx ?? this.prisma;
    const row = await prisma.ledgerAccount.findUnique({
      where: { code },
      select: selectLedgerAccount,
    });
    return row ? toDomain(row as LedgerAccountModel) : null;
  }

  async create(
    input: CreateLedgerAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LedgerAccount> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.ledgerAccount.create({
      data: input,
      select: selectLedgerAccount,
    });
    return toDomain(created as LedgerAccountModel);
  }

  async update(
    id: string,
    input: UpdateLedgerAccountInput,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.ledgerAccount.update({
      where: { id },
      data: input,
      select: selectLedgerAccount,
    });
    return toDomain(updated as LedgerAccountModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.ledgerAccount.delete({ where: { id } });
  }
}
