import { Identity } from '@app/domain';

export class GetUserDto {
  id: string;
  isActive: boolean;
  identityId: string;
  identity: Partial<Identity>;
}
