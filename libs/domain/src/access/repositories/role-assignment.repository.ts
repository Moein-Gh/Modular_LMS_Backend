import { Prisma } from '@generated/prisma';
import type { DomainRoleAssignment } from '../entities/role-assignment.entity';

export interface CreateRoleAssignmentInput {
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
}

export interface UpdateRoleAssignmentInput {
  isActive?: boolean;
  assignedBy?: string;
  expiresAt?: Date;
}

export interface ListRoleAssignmentsParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'assignedBy' | 'expiresAt';
  orderDir?: 'asc' | 'desc';
  userId?: string;
  includeUser?: boolean;
  includeRole?: boolean;
}

export interface ListRoleAssignmentsResult {
  items: DomainRoleAssignment[];
  total: number;
}

export interface RoleAssignmentRepository {
  findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment | null>;
  findAll(
    params: ListRoleAssignmentsParams,
    tx?: Prisma.TransactionClient,
  ): Promise<ListRoleAssignmentsResult>;
  create(
    data: CreateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment>;
  update(
    id: string,
    data: UpdateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
