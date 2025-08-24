export interface DomainRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
