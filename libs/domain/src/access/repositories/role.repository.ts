import { Prisma } from '@generated/prisma';
import type { Role } from '../entities/role.entity';
import { CreateRoleInput, ListRolesParams } from '../types/role.type';
import { BaseListResult } from '@app/domain/common/baseListResult.type';

export interface RoleRepository {
  findById(id: string, tx?: Prisma.TransactionClient): Promise<Role | null>;
  findByKey(key: string, tx?: Prisma.TransactionClient): Promise<Role | null>;
  findAll(
    params: ListRolesParams,
    tx?: Prisma.TransactionClient,
  ): Promise<BaseListResult<Role>>;
  create(data: CreateRoleInput, tx?: Prisma.TransactionClient): Promise<Role>;
  update(id: string, data: Role, tx?: Prisma.TransactionClient): Promise<Role>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
