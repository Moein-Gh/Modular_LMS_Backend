import { Permission } from '../entities/permission.entity';
import {
  CreatePermissionInput,
  UpdatePermissionInput,
} from '../types/permission.type';

export interface PermissionRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Permission[]>;
  findById(id: string, tx?: unknown): Promise<Permission | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreatePermissionInput, tx?: unknown): Promise<Permission>;
  update(
    id: string,
    account: UpdatePermissionInput,
    tx?: unknown,
  ): Promise<Permission>;
  delete(id: string, tx?: unknown): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
