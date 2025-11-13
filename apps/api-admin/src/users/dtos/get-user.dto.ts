import { Identity } from '@app/domain';

export class GetUserDto {
  id: string;
  code: number;
  isActive: boolean;
  identityId: string;
  identity: Partial<Identity>;
}
