import { BaseQueryParams, GrantType, PermissionGrant } from '@app/domain';

export type CreatePermissionGrantInput = Omit<
  PermissionGrant,
  'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'
>;

export interface UpdatePermissionGrantInput {
  isGranted?: boolean;
  reason?: string;
  expiresAt?: Date;
}

export interface ListPermissionGrantsParams extends BaseQueryParams {
  granteeType?: GrantType;
  granteeId?: string;
  permissionId?: string;
  isGranted?: boolean;
}
