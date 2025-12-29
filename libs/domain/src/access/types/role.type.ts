import { BaseQueryParams } from '@app/domain';
import { Role } from '../entities/role.entity';

export type CreateRoleInput = Pick<Role, 'name' | 'key' | 'description'> & {
  isDeleted?: boolean;
};

export type UpdateRoleInput = Partial<
  Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface ListRolesParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'name' | 'key';
}
