// AccountType Repository Interface
import { AccountType } from '../entities/account-type.entity';

export interface AccountTypeRepository {
  findById(id: string): Promise<AccountType | null>;
  findByName(name: string): Promise<AccountType | null>;
  create(accountType: AccountType): Promise<AccountType>;
  update(accountType: AccountType): Promise<AccountType>;
  delete(id: string): Promise<void>;
}
