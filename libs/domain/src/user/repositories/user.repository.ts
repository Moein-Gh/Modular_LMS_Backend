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
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null>;
  findByIdentityId(
    identityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null>;
  setActive(
    userId: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
