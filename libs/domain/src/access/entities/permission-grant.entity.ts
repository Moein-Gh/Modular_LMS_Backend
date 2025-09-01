export enum GrantType {
  USER = 'user',
  ROLE = 'role',
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
}
