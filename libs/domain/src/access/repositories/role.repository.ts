import { Prisma } from '@generated/prisma';
import type { DomainRole } from '../entities/role.entity';

export interface CreateRoleInput {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface ListRolesParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'name' | 'key';
  orderDir?: 'asc' | 'desc';
}

export interface ListRolesResult {
  items: DomainRole[];
  total: number;
}

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
  ): Promise<ListRolesResult>;
  create(
    data: CreateRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRole>;
  update(
    id: string,
    data: UpdateRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRole>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
