import { Inject, Injectable } from '@nestjs/common';
import {
  type RoleAssignmentRepository,
  ROLE_ASSIGNMENT_REPOSITORY,
} from '@app/domain';
import type { BaseListResult, DomainRoleAssignment } from '@app/domain';
import { NotFoundError } from '@app/application/errors/not-found.error';
import { Prisma } from '@generated/prisma';
import {
  CreateRoleAssignmentInput,
  ListRoleAssignmentsParams,
} from '@app/domain/access/types/role-assignment.type';

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
  ): Promise<BaseListResult<DomainRoleAssignment>> {
    return this.roleAssignment.findAll(params, tx);
  }

  update(
    id: string,
    data: DomainRoleAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainRoleAssignment> {
    return this.roleAssignment.update(id, data, tx);
  }

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    return this.roleAssignment.delete(id, tx);
  }
}
