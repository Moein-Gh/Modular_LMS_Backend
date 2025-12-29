import { BaseQueryParams } from '@app/domain';
import { RoleAssignment } from '../entities/role-assignment.entity';

export type CreateRoleAssignmentInput = Omit<
  RoleAssignment,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'status'
>;

export type UpdateRoleAssignmentInput = Partial<CreateRoleAssignmentInput>;

export interface ListRoleAssignmentsParams extends BaseQueryParams {
  userId?: string;
  roleId?: string;
  includeUser?: boolean;
  includeRole?: boolean;
}
