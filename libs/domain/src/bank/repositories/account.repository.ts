import { Account } from '@app/domain';

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  create(account: Account): Promise<Account>;
  update(account: Account): Promise<Account>;
  delete(id: string): Promise<void>;
}
