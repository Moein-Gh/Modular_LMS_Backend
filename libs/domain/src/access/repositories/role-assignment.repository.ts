import { Prisma } from '@generated/prisma';
import type { DomainRoleAssignment } from '../entities/role-assignment.entity';
import {
  CreateRoleAssignmentInput,
  ListRoleAssignmentsParams,
} from '../types/role-assignment.type';
import { BaseListResult } from '@app/domain/common/baseListResult.type';

export interface RoleAssignmentRepository {
  findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment | null>;
  findAll(
    params: ListRoleAssignmentsParams,
    tx?: Prisma.TransactionClient,
  ): Promise<BaseListResult<DomainRoleAssignment>>;
  create(
    data: CreateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment>;
  update(
    id: string,
    data: DomainRoleAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
