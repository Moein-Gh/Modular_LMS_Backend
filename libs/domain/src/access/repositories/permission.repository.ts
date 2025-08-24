import type { DomainPermission } from '../entities/permission.entity';

export interface CreatePermissionInput {
  key: string;
  name: string;
  description?: string;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
}

export interface ListPermissionsParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'name' | 'key';
  orderDir?: 'asc' | 'desc';
}

export interface ListPermissionsResult {
  items: DomainPermission[];
  total: number;
}

export interface PermissionRepository {
  findById(id: string): Promise<DomainPermission | null>;
  findByKey(key: string): Promise<DomainPermission | null>;
  list(params: ListPermissionsParams): Promise<ListPermissionsResult>;
  create(data: CreatePermissionInput): Promise<DomainPermission>;
  update(id: string, data: UpdatePermissionInput): Promise<DomainPermission>;
  delete(id: string): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
