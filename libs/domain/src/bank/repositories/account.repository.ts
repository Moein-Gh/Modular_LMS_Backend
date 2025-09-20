import { Account } from '@app/domain';
import { Prisma } from '@generated/prisma';
import { CreateAccountInput, UpdateAccountInput } from '../types/account.type';

export interface AccountRepository {
  findAll(
    options?: Prisma.AccountFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Account[]>;
  count(
    where?: Prisma.AccountWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number>;
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
