import {
  BaseListResult,
  CreatePermissionGrantInput,
  ListPermissionGrantsParams,
  UpdatePermissionGrantInput,
} from '@app/domain';
import { PermissionGrant } from '../entities/permission-grant.entity';

export interface PermissionGrantRepository {
  findById(id: string): Promise<PermissionGrant | null>;
  findAll(
    params: ListPermissionGrantsParams,
  ): Promise<BaseListResult<PermissionGrant>>;
  create(input: CreatePermissionGrantInput): Promise<PermissionGrant>;
  update(
    id: string,
    input: UpdatePermissionGrantInput,
  ): Promise<PermissionGrant>;
  delete(id: string): Promise<void>;
}

export const PERMISSION_GRANT_REPOSITORY = Symbol('PermissionGrantRepository');
