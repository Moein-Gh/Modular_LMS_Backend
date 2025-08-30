import { DomainIdentity } from '@app/domain';

export class GetUserDto {
  id: string;
  isActive: boolean;
  identityId: string;
  identity: DomainIdentity;
}
