import type { Permission } from './permission.entity';
import type { Role } from './role.entity';

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  role?: Role;
  permission?: Permission;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
