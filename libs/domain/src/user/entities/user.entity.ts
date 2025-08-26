import { DomainIdentity } from '@app/domain/auth/entities/identity.entity';

export interface DomainUser {
  id: string;
  identityId: string;
  isActive: boolean;
  identity?: DomainIdentity;
}
