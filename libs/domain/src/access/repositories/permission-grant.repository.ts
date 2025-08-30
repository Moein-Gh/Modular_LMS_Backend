import { DomainPermissionGrant } from '../entities/permission-grant.entity';

export interface CreatePermissionGrantInput {
  granteeType: 'user' | 'role';
  granteeId: string;
  permissionId: string;
  grantedBy?: string;
  isGranted?: boolean;
  reason?: string;
  expiresAt?: Date;
}

export interface UpdatePermissionGrantInput {
  isGranted?: boolean;
  reason?: string;
  expiresAt?: Date;
}

export interface ListPermissionGrantsParams {
  granteeType?: 'user' | 'role';
  granteeId?: string;
  permissionId?: string;
  isGranted?: boolean;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDir?: 'asc' | 'desc';
}

export interface ListPermissionGrantsResult {
  items: DomainPermissionGrant[];
  total: number;
}

export interface PermissionGrantRepository {
  findById(id: string): Promise<DomainPermissionGrant | null>;
  findAll(
    params: ListPermissionGrantsParams,
  ): Promise<ListPermissionGrantsResult>;
  create(input: CreatePermissionGrantInput): Promise<DomainPermissionGrant>;
  update(
    id: string,
    input: UpdatePermissionGrantInput,
  ): Promise<DomainPermissionGrant>;
  delete(id: string): Promise<void>;
}

export const PERMISSION_GRANT_REPOSITORY = Symbol('PermissionGrantRepository');
