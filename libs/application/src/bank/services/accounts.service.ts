import { Injectable } from '@nestjs/common';
import type { Account } from '@app/domain';
import { Prisma } from '@generated/prisma';
import { PrismaAccountRepository } from '@app/infra/bank/repositories/prisma-account.repository';
import {
  CreateAccountInput,
  UpdateAccountInput,
} from '@app/domain/bank/types/account.type';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepo: PrismaAccountRepository) {}

  async list(tx?: Prisma.TransactionClient) {
    return this.accountsRepo.findAll(tx);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null> {
    return this.accountsRepo.findById(id, tx);
  }

  async findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]> {
    return this.accountsRepo.findByUserId(userId, tx);
  }

  async create(
    account: CreateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    return this.accountsRepo.create(account, tx);
  }

  async update(
    id: string,
    account: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account> {
    const exists = await this.accountsRepo.findById(id, tx);
    if (!exists) {
      throw new Error('Account not found');
    }
    return this.accountsRepo.update(id, account, tx);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.accountsRepo.delete(id, tx);
  }
}
