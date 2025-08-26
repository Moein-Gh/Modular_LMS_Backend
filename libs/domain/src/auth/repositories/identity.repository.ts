import type { DomainIdentity } from '../entities/identity.entity';

export type CreateIdentityInput = {
  phone: string;
  name?: string;
  countryCode?: string;
  nationalCode?: string;
  email?: string;
};

export interface IdentityRepository {
  create(data: CreateIdentityInput): Promise<DomainIdentity>;
}

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');
