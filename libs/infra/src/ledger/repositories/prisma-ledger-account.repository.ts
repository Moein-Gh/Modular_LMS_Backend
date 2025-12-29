import type { LedgerAccount } from '@app/domain';
import { LedgerAccountRepository } from '@app/domain';
import { LedgerAccountNotFoundError } from '@app/domain/ledger/errors/ledger-account-not-found.error';
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
    isDeleted: false,
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

  async getAccountBalance(
    accountCode: string,
    options?: { startDate?: Date; endDate?: Date },
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const prisma = tx ?? this.prisma;

    // First, get the account to determine its type
    const account = await prisma.ledgerAccount.findUnique({
      where: { code: accountCode },
      select: { id: true, type: true },
    });

    if (!account) {
      throw new LedgerAccountNotFoundError(accountCode);
    }

    // Build the where clause for journal entries
    // CRITICAL: Only include entries from POSTED journals
    const dateFilter: Prisma.DateTimeFilter | undefined =
      options?.startDate || options?.endDate
        ? {
            ...(options?.startDate ? { gte: options.startDate } : {}),
            ...(options?.endDate ? { lte: options.endDate } : {}),
          }
        : undefined;

    const whereClause: Prisma.JournalEntryWhereInput = {
      ledgerAccountId: account.id,
      journal: {
        status: 'POSTED',
        ...(dateFilter ? { postedAt: dateFilter } : {}),
      },
    };

    // Get separate totals for debits and credits
    const [debitResult, creditResult] = await Promise.all([
      prisma.journalEntry.aggregate({
        where: {
          ...whereClause,
          dc: 'DEBIT',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.journalEntry.aggregate({
        where: {
          ...whereClause,
          dc: 'CREDIT',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const totalDebits = debitResult._sum.amount?.toString() ?? '0';
    const totalCredits = creditResult._sum.amount?.toString() ?? '0';

    // Calculate balance based on account type
    // Assets and Expenses: Debits increase, Credits decrease
    // Liabilities, Equity, Income: Credits increase, Debits decrease
    const debits = parseFloat(totalDebits);
    const credits = parseFloat(totalCredits);

    let balance: number;
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      balance = debits - credits;
    } else {
      // LIABILITY, EQUITY, INCOME
      balance = credits - debits;
    }

    // Return as string to preserve precision
    return balance.toFixed(4);
  }

  async getEarliestPostedDate(
    accountCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Date | null> {
    const prisma = tx ?? this.prisma;

    const account = await prisma.ledgerAccount.findUnique({
      where: { code: accountCode },
      select: { id: true },
    });

    if (!account) return null;

    const row = await prisma.journalEntry.findFirst({
      where: { ledgerAccountId: account.id, journal: { status: 'POSTED' } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return row ? row.createdAt : null;
  }
}
