import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY,
  type RoleAssignmentRepository,
  type CreateRoleAssignmentInput,
  type UpdateRoleAssignmentInput,
  type ListRoleAssignmentsParams,
  type ListRoleAssignmentsResult,
} from '@app/domain';
import type { DomainRoleAssignment } from '@app/domain';
import { ensureFound } from '../../utils/ensure-found';

@Injectable()
export class RoleAssignmentService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly roleAssignment: RoleAssignmentRepository,
  ) {}

  create(input: CreateRoleAssignmentInput): Promise<DomainRoleAssignment> {
    return this.roleAssignment.create(input);
  }

  getById(id: string): Promise<DomainRoleAssignment> {
    return this.roleAssignment
      .findById(id)
      .then((p) =>
        ensureFound(p, { entity: 'RoleAssignment', by: 'id', value: id }),
      );
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
