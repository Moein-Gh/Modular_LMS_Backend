import { BaseQueryParams } from '@app/domain';
import { Permission } from '../entities/permission.entity';

export type CreatePermissionInput = Omit<
  Permission,
  | 'id'
  | 'code'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
>;

export type UpdatePermissionInput = Partial<CreatePermissionInput>;

export interface ListPermissionsParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
