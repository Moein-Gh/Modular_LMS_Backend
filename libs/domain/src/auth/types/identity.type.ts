import { Identity } from '../entities/identity.entity';

export type CreateIdentityInput = Omit<
  Identity,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateIdentityInput = Partial<CreateIdentityInput>;
