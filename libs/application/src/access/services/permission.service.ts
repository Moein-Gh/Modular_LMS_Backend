import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY,
  type PermissionRepository,
  type CreatePermissionInput,
  type UpdatePermissionInput,
  type ListPermissionsParams,
  type ListPermissionsResult,
} from '@app/domain';
import type { DomainPermission } from '@app/domain';
import { NotFoundError } from '@app/application/errors/not-found.error';

@Injectable()
export class PermissionService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissions: PermissionRepository,
  ) {}

  create(input: CreatePermissionInput): Promise<DomainPermission> {
    return this.permissions.create(input);
  }

  async getById(id: string): Promise<DomainPermission> {
    const permission = await this.permissions.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission', 'id', id);
    }
    return permission;
  }

  async getByKey(key: string): Promise<DomainPermission> {
    const permission = await this.permissions.findByKey(key);
    if (!permission) {
      throw new NotFoundError('Permission', 'key', key);
    }
    return permission;
  }

  findAll(params: ListPermissionsParams): Promise<ListPermissionsResult> {
    return this.permissions.findAll(params);
  }

  update(id: string, data: UpdatePermissionInput): Promise<DomainPermission> {
    return this.permissions.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.permissions.delete(id);
  }
}
