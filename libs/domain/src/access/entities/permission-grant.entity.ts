export enum GrantType {
  USER = 'USER',
  ROLE = 'ROLE',
}

export interface PermissionGrant {
  id: string;
  granteeType: GrantType;
  granteeId: string;
  permissionId: string;
  grantedBy?: string;
  isGranted: boolean;
  reason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
