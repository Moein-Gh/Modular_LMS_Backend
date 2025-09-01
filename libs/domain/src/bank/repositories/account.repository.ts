import { Account } from '@app/domain';
import { CreateAccountInput, UpdateAccountInput } from '../types/account.type';

export interface AccountRepository {
  findAll(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  create(account: CreateAccountInput): Promise<Account>;
  update(id: string, account: UpdateAccountInput): Promise<Account>;
  delete(id: string): Promise<void>;
}
