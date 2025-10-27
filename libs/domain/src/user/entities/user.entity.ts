import { Identity } from '@app/domain';

export interface User {
  id: string;
  code: number;
  identityId: string;
  isActive: boolean;
  identity?: Partial<Identity>;
}
