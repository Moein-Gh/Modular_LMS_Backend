import { Injectable } from '@nestjs/common';
import type {
  AccountType,
  CreateAccountTypeInput,
  UpdateAccountTypeInput,
} from '@app/domain';
import { Prisma } from '@generated/prisma';
import { PrismaAccountTypeRepository } from '@app/infra/bank/repositories/prisma-account-type.repository';
import { AccountTypeNameTakenError } from '../errors/account-type-name-taken.error';

@Injectable()
export class AccountTypesService {
  constructor(private readonly accountTypesRepo: PrismaAccountTypeRepository) {}

  async list(tx?: Prisma.TransactionClient) {
    return this.accountTypesRepo.findAll(tx);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType | null> {
    return this.accountTypesRepo.findById(id, tx);
  }

  async create(
    input: CreateAccountTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    const existing = await this.accountTypesRepo.findByName(input.name, tx);
    if (existing) {
      throw new AccountTypeNameTakenError(input.name);
    }
    return this.accountTypesRepo.create(input, tx);
  }

  async update(
    id: string,
    input: UpdateAccountTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountType> {
    return this.accountTypesRepo.update(id, input, tx);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.accountTypesRepo.delete(id, tx);
  }
}
