import { RoleAssignment } from '../entities/role-assignment.entity';
import {
  CreateRoleAssignmentInput,
  UpdateRoleAssignmentInput,
} from '../types/role-assignment.type';

export interface RoleAssignmentRepository {
  findAll(options?: unknown, tx?: unknown): Promise<RoleAssignment[]>;
  findById(id: string, tx?: unknown): Promise<RoleAssignment | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(
    account: CreateRoleAssignmentInput,
    tx?: unknown,
  ): Promise<RoleAssignment>;
  update(
    id: string,
    account: UpdateRoleAssignmentInput,
    tx?: unknown,
  ): Promise<RoleAssignment>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
}

export const ROLE_ASSIGNMENT_REPOSITORY = Symbol('ROLE_ASSIGNMENT_REPOSITORY');
