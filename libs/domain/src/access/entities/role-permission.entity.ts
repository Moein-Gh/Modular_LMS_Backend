export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
