import { BaseQueryParams } from '@app/domain';
import { RolePermission } from '../entities/role-permission.entity';

export type CreateRolePermissionInput = Omit<
  RolePermission,
  'id' | 'code' | 'createdAt' | 'updatedAt'
>;

export type UpdateRolePermissionInput = Partial<CreateRolePermissionInput>;
export interface ListRolePermissionsParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
