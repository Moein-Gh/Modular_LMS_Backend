import { BadRequestException, Injectable } from '@nestjs/common';
import type { Account } from '@app/domain';
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from '@app/domain/bank/types/account.type';
import { Prisma } from '@generated/prisma';
import { NotFoundError } from '@app/application/errors/not-found.error';
import {
  PrismaAccountRepository,
  PrismaAccountTypeRepository,
} from '@app/infra';

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly accountTypesRepo: PrismaAccountTypeRepository,
  ) {}

  async list(tx?: Prisma.TransactionClient) {
    return this.accountsRepo.findAll(tx, {
      include: { accountType: true, user: { include: { identity: true } } },
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
    // check if accountTypeId exists
    console.log(input.accountTypeId);
    const accountType = await this.accountTypesRepo.findById(
      input.accountTypeId,
    );

    if (!accountType) {
      throw new NotFoundError('AccountType', 'id', input.accountTypeId);
    }

    // check if cardNumber is unique
    const existing = await this.accountsRepo.findUnique({
      where: { cardNumber: input.cardNumber },
    });
    if (existing) {
      throw new BadRequestException('Card number must be unique');
    }

    // Generate name
    const name: string =
      input.name ?? `${input.bankName.trim()}-${input.cardNumber.slice(-4)}`;

    const payload: CreateAccountInput & { name: string } = {
      ...input,
      name,
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
}
