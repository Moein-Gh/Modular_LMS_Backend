import { DomainPermissionGrant, GrantType } from '@app/domain';
import { BaseQueryParams } from '@app/domain';

export type CreatePermissionGrantInput = Omit<
  DomainPermissionGrant,
  'id' | 'createdAt' | 'updatedAt'
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
