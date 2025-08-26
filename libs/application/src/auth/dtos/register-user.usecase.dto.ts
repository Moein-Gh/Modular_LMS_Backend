import { DomainIdentity, DomainUser } from '@app/domain';

export type RegisterUserInput = {
  phone: string;
  email?: string;
  name?: string;
  countryCode?: string;
  nationalCode?: string;
};

export type RegisterUserResult = {
  user: DomainUser & { identity: DomainIdentity };
};
