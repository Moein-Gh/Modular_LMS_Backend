import { BaseQueryParams } from '@app/domain';

export interface ListPermissionsQuery extends BaseQueryParams {
  search?: string;
  orderBy?: 'createdAt' | 'name' | 'key';
}
