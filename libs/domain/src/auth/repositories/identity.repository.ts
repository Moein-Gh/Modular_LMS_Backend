import type { DomainIdentity } from '../entities/identity.entity';

export type CreateIdentityInput = {
  name: string;
  countryCode: string;
  phone: string;
  nationalCode: string;
  email: string | null;
};

export interface IdentityRepository {
  create(data: CreateIdentityInput): Promise<DomainIdentity>;
}

export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');
