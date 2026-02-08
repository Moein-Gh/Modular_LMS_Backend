import { RolePermission } from '../entities/role-permission.entity';
import {
  CreateRolePermissionInput,
  UpdateRolePermissionInput,
} from '../types/role-permission.type';

export interface RolePermissionRepository {
  create(
    rolePermission: CreateRolePermissionInput,
    tx?: unknown,
  ): Promise<RolePermission>;
  findById(id: string, tx?: unknown): Promise<RolePermission | null>;
  findByRoleId(roleId: string, tx?: unknown): Promise<RolePermission[]>;
  findByPermissionId(
    permissionId: string,
    tx?: unknown,
  ): Promise<RolePermission[]>;
  list(tx?: unknown): Promise<RolePermission[]>;
  update(
    id: string,
    update: Partial<UpdateRolePermissionInput>,
    tx?: unknown,
  ): Promise<RolePermission>;
  delete(id: string, tx?: unknown): Promise<void>;
}

export const ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');
