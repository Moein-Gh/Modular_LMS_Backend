import { BaseQueryParams } from '@app/domain';
import { RoleAssignment } from '../entities/role-assignment.entity';

export type CreateRoleAssignmentInput = Omit<
  RoleAssignment,
  'id' | 'createdAt' | 'updatedAt' | 'isActive'
>;

export type UpdateRoleAssignmentInput = Partial<CreateRoleAssignmentInput>;

export interface ListRoleAssignmentsParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'assignedBy' | 'expiresAt';
  userId?: string;
  includeUser?: boolean;
  includeRole?: boolean;
}
