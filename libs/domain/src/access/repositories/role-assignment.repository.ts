import type { DomainRoleAssignment } from '../entities/role-assignment.entity';

export interface CreateRoleAssignmentInput {
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
}

export interface UpdateRoleAssignmentInput {
  assignedBy?: string;
  expiresAt?: Date;
}

export interface ListRoleAssignmentsParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'assignedBy' | 'expiresAt';
  orderDir?: 'asc' | 'desc';
}

export interface ListRoleAssignmentsResult {
  items: DomainRoleAssignment[];
  total: number;
}

export interface RoleAssignmentRepository {
  findById(id: string): Promise<DomainRoleAssignment | null>;
  list(params: ListRoleAssignmentsParams): Promise<ListRoleAssignmentsResult>;
  create(data: CreateRoleAssignmentInput): Promise<DomainRoleAssignment>;
  update(
    id: string,
    data: UpdateRoleAssignmentInput,
  ): Promise<DomainRoleAssignment>;
  delete(id: string): Promise<void>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
