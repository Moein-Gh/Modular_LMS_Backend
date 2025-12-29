import { RolePermission } from '../entities/role-permission.entity';
import {
  CreateRolePermissionInput,
  UpdateRolePermissionInput,
} from '../types/role-permission.type';

export interface IRolePermissionRepository {
  create(rolePermission: CreateRolePermissionInput): Promise<RolePermission>;
  findById(id: string): Promise<RolePermission | null>;
  findByRoleId(roleId: string): Promise<RolePermission[]>;
  findByPermissionId(permissionId: string): Promise<RolePermission[]>;
  list(): Promise<RolePermission[]>;
  update(
    id: string,
    update: Partial<UpdateRolePermissionInput>,
  ): Promise<RolePermission>;
  delete(id: string): Promise<void>;
}
