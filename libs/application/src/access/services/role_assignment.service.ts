import { Inject, Injectable } from '@nestjs/common';
import {
  type RoleAssignmentRepository,
  type CreateRoleAssignmentInput,
  type UpdateRoleAssignmentInput,
  type ListRoleAssignmentsParams,
  type ListRoleAssignmentsResult,
  ROLE_ASSIGNMENT_REPOSITORY,
} from '@app/domain';
import type { DomainRoleAssignment } from '@app/domain';
import { NotFoundError } from '@app/application/errors/not-found.error';
import { Prisma } from '@generated/prisma';

@Injectable()
export class RoleAssignmentService {
  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly roleAssignment: RoleAssignmentRepository,
  ) {}

  create(
    input: CreateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment> {
    return this.roleAssignment.create(input, tx);
  }

  async getById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment> {
    const roleAssignment = await this.roleAssignment.findById(id, tx);
    if (!roleAssignment) {
      throw new NotFoundError('RoleAssignment', 'id', id);
    }
    return roleAssignment;
  }

  findAll(
    params: ListRoleAssignmentsParams,
    tx?: Prisma.TransactionClient,
  ): Promise<ListRoleAssignmentsResult> {
    return this.roleAssignment.findAll(params, tx);
  }

  update(
    id: string,
    data: UpdateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment> {
    return this.roleAssignment.update(id, data, tx);
  }

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    return this.roleAssignment.delete(id, tx);
  }
}
