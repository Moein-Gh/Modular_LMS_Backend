import { CreateUserInput } from '@app/application';
import type { DomainUser } from '../entities/user.entity';

import type { Prisma } from '@generated/prisma';

export interface IUserRepository {
  createUser(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser>;
  findById(
    id: string,
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null>;
  findByIdentityId(
    identityId: string,
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null>;
  setActive(
    userId: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  deleteUser(id: string, tx?: Prisma.TransactionClient): Promise<void>;
  findAll(
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser[]>;
}
