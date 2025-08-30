import { BaseQueryParams } from '@app/domain';
import { DomainPermission } from '../entities/permission.entity';

export type CreatePermissionInput = Omit<
  DomainPermission,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface ListPermissionsParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
