import { CreateUserInput } from '@app/application';
import { UpdateUserInput } from '@app/application/user/types/update-user.type';
import { BaseQueryParams } from '@app/domain/common';
import { User } from '../entities/user.entity';

export interface ListUserParams extends BaseQueryParams {
  identityName?: string;
  identityEmail?: string;
  isActive?: boolean;
}

export interface IUserRepository {
  findAll(options?: unknown, tx?: unknown): Promise<User[]>;
  findById(id: string, tx?: unknown): Promise<User | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateUserInput, tx?: unknown): Promise<User>;
  update(id: string, account: UpdateUserInput, tx?: unknown): Promise<User>;
  delete(id: string, tx?: unknown): Promise<void>;
}
