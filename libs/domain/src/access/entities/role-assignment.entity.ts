import { DomainUser } from '@app/domain/user/entities/user.entity';
import { DomainRole } from './role.entity';

export interface DomainRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  user?: DomainUser;
  role?: DomainRole;
}
