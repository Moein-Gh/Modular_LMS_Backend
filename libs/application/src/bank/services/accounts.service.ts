import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type { Account } from '@app/domain';
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from '@app/domain/bank/types/account.type';
import {
  PrismaAccountRepository,
  PrismaAccountTypeRepository,
} from '@app/infra';
import { Prisma } from '@generated/prisma';
import { BadRequestException, Injectable } from '@nestjs/common';
@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly accountTypesRepo: PrismaAccountTypeRepository,
  ) {}

  async list(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      Account,
      Prisma.AccountFindManyArgs,
      Prisma.AccountWhereInput
    >({
      repo: this.accountsRepo,
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

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null> {
    return this.accountsRepo.findUnique(
      {
        where: { id },
        include: { accountType: true, user: { include: { identity: true } } },
      },
      tx,
    );
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

    return this.accountsRepo.create(payload, tx);
  }

  async update(
    id: string,
    account: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const exists = await this.accountsRepo.findUnique({ where: { id } }, tx);
    if (!exists) {
      throw new Error('Account not found');
    }
    return this.accountsRepo.update(id, account, tx);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.accountsRepo.delete(id, tx);
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
