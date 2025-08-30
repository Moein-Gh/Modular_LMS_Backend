import { Prisma } from '@generated/prisma';
import type { DomainRole } from '../entities/role.entity';
import { CreateRoleInput, ListRolesParams } from '../types/role.type';
import { BaseListResult } from '@app/domain/common/baseListResult.type';

export interface RoleRepository {
  findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRole | null>;
  findByKey(
    key: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRole | null>;
  findAll(
    params: ListRolesParams,
    tx?: Prisma.TransactionClient,
  ): Promise<BaseListResult<DomainRole>>;
  create(
    data: CreateRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRole>;
  update(
    id: string,
    data: DomainRole,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRole>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
