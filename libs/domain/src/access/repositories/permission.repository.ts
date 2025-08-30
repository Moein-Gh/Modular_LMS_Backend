import { Prisma } from '@generated/prisma';
import type { DomainPermission } from '../entities/permission.entity';
import {
  CreatePermissionInput,
  ListPermissionsParams,
} from '../types/permission.type';
import { BaseListResult } from '@app/domain';

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
  ): Promise<BaseListResult<DomainPermission>>;

  create(
    data: CreatePermissionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission>;

  update(
    id: string,
    data: DomainPermission,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission>;

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
