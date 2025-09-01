import { AccountType } from '../entities/account-type.entity';
import { CreateAccountTypeInput, UpdateAccountTypeInput } from '@app/domain';

export interface AccountTypeRepository {
  findAll(): Promise<AccountType[]>;
  findById(id: string): Promise<AccountType | null>;
  create(accountType: CreateAccountTypeInput): Promise<AccountType>;
  update(id: string, accountType: UpdateAccountTypeInput): Promise<AccountType>;
  delete(id: string): Promise<void>;
}
