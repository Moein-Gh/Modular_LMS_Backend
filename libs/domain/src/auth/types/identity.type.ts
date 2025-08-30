import { DomainIdentity } from '../entities/identity.entity';

export type CreateIdentityInput = Omit<
  DomainIdentity,
  'id' | 'createdAt' | 'updatedAt'
>;
