import { User } from '@app/domain/user/entities/user.entity';
import { Role } from './role.entity';

export enum RoleAssignmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  status: RoleAssignmentStatus;
  user?: User;
  role?: Role;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
