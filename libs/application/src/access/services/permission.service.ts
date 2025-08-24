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
import { ensureFound } from '../../utils/ensure-found';

@Injectable()
export class PermissionService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissions: PermissionRepository,
  ) {}

  create(input: CreatePermissionInput): Promise<DomainPermission> {
    return this.permissions.create(input);
  }

  getById(id: string): Promise<DomainPermission> {
    return this.permissions
      .findById(id)
      .then((p) =>
        ensureFound(p, { entity: 'Permission', by: 'id', value: id }),
      );
  }

  getByKey(key: string): Promise<DomainPermission> {
    return this.permissions
      .findByKey(key)
      .then((p) =>
        ensureFound(p, { entity: 'Permission', by: 'key', value: key }),
      );
  }

  list(params: ListPermissionsParams): Promise<ListPermissionsResult> {
    return this.permissions.list(params);
  }

  update(id: string, data: UpdatePermissionInput): Promise<DomainPermission> {
    return this.permissions.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.permissions.delete(id);
  }
}
