import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
  type CreateRoleInput,
  type UpdateRoleInput,
  type ListRolesParams,
  type ListRolesResult,
} from '@app/domain';
import type { DomainRole } from '@app/domain';
import { ensureFound } from '../../utils/ensure-found';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  create(input: CreateRoleInput): Promise<DomainRole> {
    return this.roles.create(input);
  }

  async getById(id: string): Promise<DomainRole> {
    const role = await this.roles.findById(id);
    return ensureFound(role, { entity: 'Role', by: 'id', value: id });
  }

  async getByKey(key: string): Promise<DomainRole> {
    const role = await this.roles.findByKey(key);
    return ensureFound(role, { entity: 'Role', by: 'key', value: key });
  }

  list(params: ListRolesParams): Promise<ListRolesResult> {
    return this.roles.list(params);
  }

  update(id: string, data: UpdateRoleInput): Promise<DomainRole> {
    return this.roles.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.roles.delete(id);
  }
}
