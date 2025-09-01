import { Prisma } from '@generated/prisma';
import type { RoleAssignment } from '../entities/role-assignment.entity';
import {
  CreateRoleAssignmentInput,
  ListRoleAssignmentsParams,
} from '../types/role-assignment.type';
import { BaseListResult } from '@app/domain/common/baseListResult.type';

export interface RoleAssignmentRepository {
  findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment | null>;
  findAll(
    params: ListRoleAssignmentsParams,
    tx?: Prisma.TransactionClient,
  ): Promise<BaseListResult<RoleAssignment>>;
  create(
    data: CreateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment>;
  update(
    id: string,
    data: RoleAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
