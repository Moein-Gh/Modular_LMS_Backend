import { UserStatus } from '@app/domain';

export type CreateUserInput = {
  identityId: string;
};

export interface CreateUserResult {
  id: string;
  identityId: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
