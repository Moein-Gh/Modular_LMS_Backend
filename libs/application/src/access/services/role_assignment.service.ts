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

@Injectable()
export class RoleAssignmentService {
  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly roleAssignment: RoleAssignmentRepository,
  ) {}

  create(input: CreateRoleAssignmentInput): Promise<DomainRoleAssignment> {
    return this.roleAssignment.create(input);
  }

  async getById(id: string): Promise<DomainRoleAssignment> {
    const roleAssignment = await this.roleAssignment.findById(id);
    if (!roleAssignment) {
      throw new NotFoundError('RoleAssignment', 'id', id);
    }
    return roleAssignment;
  }

  list(params: ListRoleAssignmentsParams): Promise<ListRoleAssignmentsResult> {
    return this.roleAssignment.list(params);
  }

  update(
    id: string,
    data: UpdateRoleAssignmentInput,
  ): Promise<DomainRoleAssignment> {
    return this.roleAssignment.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.roleAssignment.delete(id);
  }
}
