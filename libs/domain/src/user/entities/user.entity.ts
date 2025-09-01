import { Identity } from '@app/domain';

export interface User {
  id: string;
  identityId: string;
  isActive: boolean;
  identity?: Identity;
}
