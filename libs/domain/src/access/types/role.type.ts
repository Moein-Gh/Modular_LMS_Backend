import { BaseQueryParams } from '@app/domain';
import { Role } from '../entities/role.entity';

export type CreateRoleInput = Omit<
  Role,
  'id' | 'code' | 'createdAt' | 'updatedAt'
>;

export type UpdateRoleInput = Omit<Role, 'id' | 'createdAt' | 'updatedAt'>;

export interface ListRolesParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
