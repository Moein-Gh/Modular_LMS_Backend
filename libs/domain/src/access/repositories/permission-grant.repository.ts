import {
  BaseListResult,
  CreatePermissionGrantInput,
  ListPermissionGrantsParams,
  UpdatePermissionGrantInput,
} from '@app/domain';
import { DomainPermissionGrant } from '../entities/permission-grant.entity';

export interface PermissionGrantRepository {
  findById(id: string): Promise<DomainPermissionGrant | null>;
  findAll(
    params: ListPermissionGrantsParams,
  ): Promise<BaseListResult<DomainPermissionGrant>>;
  create(input: CreatePermissionGrantInput): Promise<DomainPermissionGrant>;
  update(
    id: string,
    input: UpdatePermissionGrantInput,
  ): Promise<DomainPermissionGrant>;
  delete(id: string): Promise<void>;
}

export const PERMISSION_GRANT_REPOSITORY = Symbol('PermissionGrantRepository');
