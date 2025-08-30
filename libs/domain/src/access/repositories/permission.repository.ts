import { Prisma } from '@generated/prisma';
import type { DomainPermission } from '../entities/permission.entity';

export interface CreatePermissionInput {
  key: string;
  name: string;
  description?: string;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
}

export interface ListPermissionsParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'name' | 'key';
  orderDir?: 'asc' | 'desc';
}

export interface ListPermissionsResult {
  items: DomainPermission[];
  total: number;
}

export interface PermissionRepository {
  findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission | null>;
  findByKey(
    key: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission | null>;
  findAll(
    params: ListPermissionsParams,
    tx?: Prisma.TransactionClient,
  ): Promise<ListPermissionsResult>;
  create(
    data: CreatePermissionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission>;
  update(
    id: string,
    data: UpdatePermissionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
