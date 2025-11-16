import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type { Account } from '@app/domain';
import { SubscriptionFeeStatus } from '@app/domain';
import type {
  CreateAccountInput,
  ListAccountQueryInput,
  UpdateAccountInput,
} from '@app/domain/bank/types/account.type';
import {
  PrismaAccountRepository,
  PrismaAccountTypeRepository,
  PrismaBankRepository,
  PrismaSubscriptionFeeRepository,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly accountTypesRepo: PrismaAccountTypeRepository,
    private readonly bankRepo: PrismaBankRepository,
    private readonly subscriptionFeesRepo: PrismaSubscriptionFeeRepository,
    private readonly transactionalRepo: PrismaTransactionalRepository,
  ) {}

  async findAll(query?: ListAccountQueryInput, tx?: Prisma.TransactionClient) {
    const where: Prisma.AccountWhereInput = {};

    if (query?.userId) {
      where.userId = query.userId;
    }

    if (query?.accountTypeId) {
      where.accountTypeId = query.accountTypeId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    return paginatePrisma<
      Account,
      Prisma.AccountFindManyArgs,
      Prisma.AccountWhereInput
    >({
      repo: this.accountsRepo,
      where,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['name', 'cardNumber', 'bankName'],
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
      include: {
        accountType: true,
        user: { include: { identity: { select: { name: true } } } },
      },
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Account> {
    const account = await this.accountsRepo.findUnique(
      {
        where: { id },
        include: { accountType: true, user: { include: { identity: true } } },
      },
      tx,
    );
    if (!account) {
      throw new NotFoundError('Account', 'id', id);
    }
    return account;
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]> {
    return this.accountsRepo.findByUserId(userId, tx);
  }

  async create(
    input: CreateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    await this.validateAccountType(input.accountTypeId);

    await this.checkAccountTypeMaxAccounts(input.accountTypeId, tx);

    await this.isCardUnique(input);

    const payload: CreateAccountInput & { name: string } = {
      ...input,
      name: this.generateName(input),
    };
    const run = async (DBtx: Prisma.TransactionClient) => {
      const created = await this.accountsRepo.create(payload, DBtx);

      const bank = await this.bankRepo.findOne(DBtx);
      if (bank && bank.subscriptionFee) {
        const baseAmount = bank.subscriptionFee;
        const now = new Date();
        for (let i = 1; i <= 6; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          await this.subscriptionFeesRepo.create(
            {
              accountId: created.id,
              periodStart: d,
              amount: baseAmount,
              status: SubscriptionFeeStatus.DUE,
            },
            DBtx,
          );
        }
      }

      return created;
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  async update(
    id: string,
    account: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const exists = await this.accountsRepo.findUnique({ where: { id } }, tx);
    if (!exists) {
      throw new NotFoundError('Account', 'id', id);
    }
    try {
      return await this.accountsRepo.update(id, account, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Account', 'id', id);
      }
      throw e;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const exists = await this.accountsRepo.findUnique({ where: { id } }, tx);
    if (!exists) {
      throw new NotFoundError('Account', 'id', id);
    }
    try {
      await this.accountsRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Account', 'id', id);
      }
      throw e;
    }
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  // Checks to see if the card number is unique
  private async isCardUnique(input: CreateAccountInput) {
    const existing = await this.accountsRepo.findUnique({
      where: { cardNumber: input.cardNumber },
    });
    if (existing) {
      throw new BadRequestException('Card number must be unique');
    }
  }

  // Generates a name if not provided
  private generateName(input: CreateAccountInput): string {
    return (
      input.name ?? `${input.bankName.trim()}-${input.cardNumber.slice(-4)}`
    );
  }

  // Validates that the account type exists
  private async validateAccountType(accountTypeId: string) {
    const accountType = await this.accountTypesRepo.findById(accountTypeId);

    if (!accountType) {
      throw new NotFoundError('AccountType', 'id', accountTypeId);
    }
  }

  // Checks if the account type has a max accounts limit and enforces it
  private async checkAccountTypeMaxAccounts(
    accountTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const accountType = await this.accountTypesRepo.findById(accountTypeId, tx);
    if (
      accountType?.maxAccounts !== null &&
      accountType?.maxAccounts !== undefined
    ) {
      const currentCount = await this.accountsRepo.findAll(
        {
          where: { accountTypeId },
        },
        tx,
      );
      if (currentCount.length >= accountType.maxAccounts) {
        throw new BadRequestException(
          `Cannot create more than ${accountType.maxAccounts} accounts for this account type`,
        );
      }
    }
  }
}
