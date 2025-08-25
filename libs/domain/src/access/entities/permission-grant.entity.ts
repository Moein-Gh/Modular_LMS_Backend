export interface DomainPermissionGrant {
  id: string;
  granteeType: 'user' | 'role';
  granteeId: string;
  permissionId: string;
  grantedBy?: string;
  isGranted: boolean;
  reason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
