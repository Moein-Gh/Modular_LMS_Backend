import { Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_GRANT_REPOSITORY,
  type PermissionGrantRepository,
  type UpdatePermissionGrantInput,
  type ListPermissionGrantsParams,
} from '@app/domain';
import type {
  BaseListResult,
  CreatePermissionGrantInput,
  PermissionGrant,
} from '@app/domain';
import { NotFoundError } from '@app/application/errors/not-found.error';

@Injectable()
export class PermissionGrantService {
  constructor(
    @Inject(PERMISSION_GRANT_REPOSITORY)
    private readonly permissionGrants: PermissionGrantRepository,
  ) {}

  create(input: CreatePermissionGrantInput): Promise<PermissionGrant> {
    return this.permissionGrants.create(input);
  }

  async getById(id: string): Promise<PermissionGrant> {
    const grant = await this.permissionGrants.findById(id);
    if (!grant) {
      throw new NotFoundError('PermissionGrant', 'id', id);
    }
    return grant;
  }

  findAll(
    params: ListPermissionGrantsParams,
  ): Promise<BaseListResult<PermissionGrant>> {
    return this.permissionGrants.findAll(params);
  }

  update(
    id: string,
    data: UpdatePermissionGrantInput,
  ): Promise<PermissionGrant> {
    return this.permissionGrants.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.permissionGrants.delete(id);
  }
}
