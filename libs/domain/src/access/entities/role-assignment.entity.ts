import { DomainUser } from '@app/domain/user/entities/user.entity';
import { DomainRole } from './role.entity';

export interface DomainRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  user?: DomainUser;
  role?: DomainRole;
}
