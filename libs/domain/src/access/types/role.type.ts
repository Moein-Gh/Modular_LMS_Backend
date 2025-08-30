import { BaseQueryParams } from '@app/domain';
import { DomainRole } from '../entities/role.entity';

export type CreateRoleInput = Omit<
  DomainRole,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface ListRolesParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
