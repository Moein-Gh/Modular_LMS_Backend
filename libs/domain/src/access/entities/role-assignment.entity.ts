import { User } from '@app/domain/user/entities/user.entity';
import { Role } from './role.entity';

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  user?: User;
  role?: Role;
}
