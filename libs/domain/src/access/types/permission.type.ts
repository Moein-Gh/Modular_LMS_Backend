import { BaseQueryParams } from '@app/domain';
import { Permission } from '../entities/permission.entity';

export type CreatePermissionInput = Omit<
  Permission,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdatePermissionInput = Partial<CreatePermissionInput>;

export interface ListPermissionsParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
