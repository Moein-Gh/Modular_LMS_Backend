import { UserStatus } from '@app/domain';

export type UpdateUserInput = Partial<{
  identityId: string;
  status: UserStatus;
}>;
