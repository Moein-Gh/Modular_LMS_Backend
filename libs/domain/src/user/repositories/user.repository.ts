import { CreateUserInput } from '@app/application';
import type { User } from '../entities/user.entity';

import type { Prisma } from '@generated/prisma';

export interface IUserRepository {
  createUser(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User>;
  findById(
    id: string,
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null>;
  findByIdentityId(
    identityId: string,
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null>;
  setActive(
    userId: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  deleteUser(id: string, tx?: Prisma.TransactionClient): Promise<void>;
  findAll(include: boolean, tx?: Prisma.TransactionClient): Promise<User[]>;
}
