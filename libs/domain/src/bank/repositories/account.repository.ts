import { Account } from '@app/domain';
import { CreateAccountInput, UpdateAccountInput } from '../types/account.type';
import { Prisma } from '@generated/prisma';

export interface AccountRepository {
  findAll(
    tx?: Prisma.TransactionClient,
    options?: Prisma.AccountFindManyArgs,
  ): Promise<Account[]>;
  findUnique(
    options: Prisma.AccountFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Account | null>;
  findByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]>;
  create(
    account: CreateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account>;
  update(
    id: string,
    account: UpdateAccountInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Account>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}
