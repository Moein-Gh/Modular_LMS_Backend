import { PermissionGrant } from '../entities/permission-grant.entity';
import {
  CreatePermissionGrantInput,
  UpdatePermissionGrantInput,
} from '../types/permission-grant.type';

export interface PermissionGrantRepository {
  findAll(options?: unknown, tx?: unknown): Promise<PermissionGrant[]>;
  findById(id: string, tx?: unknown): Promise<PermissionGrant | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(
    account: CreatePermissionGrantInput,
    tx?: unknown,
  ): Promise<PermissionGrant>;
  update(
    id: string,
    account: UpdatePermissionGrantInput,
    tx?: unknown,
  ): Promise<PermissionGrant>;
  delete(id: string, tx?: unknown): Promise<void>;
}

export const PERMISSION_GRANT_REPOSITORY = Symbol('PermissionGrantRepository');
