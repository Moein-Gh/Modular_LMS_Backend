import { Prisma } from '@generated/prisma';
import type { DomainIdentity } from '../entities/identity.entity';
import { CreateIdentityInput } from '../types/identity.type';

export interface IdentityRepository {
  create(
    data: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity>;
  update(
    id: string,
    data: DomainIdentity,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity>;
  findOne(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity | null>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');
