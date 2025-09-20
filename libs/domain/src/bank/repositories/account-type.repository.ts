import { CreateAccountTypeInput, UpdateAccountTypeInput } from '@app/domain';
import { AccountType } from '../entities/account-type.entity';

export interface AccountTypeRepository {
  findAll(): Promise<AccountType[]>;
  count(): Promise<number>;
  findById(id: string): Promise<AccountType | null>;
  findByName(name: string): Promise<AccountType | null>;
  create(accountType: CreateAccountTypeInput): Promise<AccountType>;
  update(id: string, accountType: UpdateAccountTypeInput): Promise<AccountType>;
  delete(id: string): Promise<void>;
}
