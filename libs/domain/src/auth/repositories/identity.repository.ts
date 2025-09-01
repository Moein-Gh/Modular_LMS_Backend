import { Prisma } from '@generated/prisma';
import type { Identity } from '../entities/identity.entity';
import { CreateIdentityInput } from '../types/identity.type';

export interface IdentityRepository {
  create(
    data: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity>;
  update(
    id: string,
    data: Identity,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity>;
  findOne(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity | null>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');
