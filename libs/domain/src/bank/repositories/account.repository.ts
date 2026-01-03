import { Account } from '@app/domain';
import { CreateAccountInput, UpdateAccountInput } from '../types/account.type';

export interface AccountRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Account[]>;
  findById(id: string, tx?: unknown): Promise<Account | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateAccountInput, tx?: unknown): Promise<Account>;
  update(
    id: string,
    account: UpdateAccountInput,
    tx?: unknown,
  ): Promise<Account>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
}
