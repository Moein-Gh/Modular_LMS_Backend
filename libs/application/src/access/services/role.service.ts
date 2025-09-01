import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY, type RoleRepository } from '@app/domain';
import type { BaseListResult, Role } from '@app/domain';
import { NotFoundError } from '@app/application/errors/not-found.error';
import {
  CreateRoleInput,
  ListRolesParams,
} from '@app/domain/access/types/role.type';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  create(input: CreateRoleInput): Promise<Role> {
    return this.roles.create(input);
  }

  async getById(id: string): Promise<Role> {
    const role = await this.roles.findById(id);
    if (!role) {
      throw new NotFoundError('Role', 'id', id);
    }
    return role;
  }

  async getByKey(key: string): Promise<Role> {
    const role = await this.roles.findByKey(key);
    if (!role) {
      throw new NotFoundError('Role', 'key', key);
    }
    return role;
  }

  findAll(params: ListRolesParams): Promise<BaseListResult<Role>> {
    return this.roles.findAll(params);
  }

  update(id: string, data: Role): Promise<Role> {
    return this.roles.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.roles.delete(id);
  }
}
