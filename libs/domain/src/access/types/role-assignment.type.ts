import { BaseQueryParams } from '@app/domain';
import { DomainRoleAssignment } from '../entities/role-assignment.entity';

export type CreateRoleAssignmentInput = Omit<
  DomainRoleAssignment,
  'id' | 'createdAt' | 'updatedAt' | 'isActive'
>;

export interface ListRoleAssignmentsParams extends BaseQueryParams {
  orderBy?: 'createdAt' | 'assignedBy' | 'expiresAt';
  userId?: string;
  includeUser?: boolean;
  includeRole?: boolean;
}
