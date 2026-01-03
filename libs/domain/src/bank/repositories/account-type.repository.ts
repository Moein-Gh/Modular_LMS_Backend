import { CreateAccountTypeInput, UpdateAccountTypeInput } from '@app/domain';
import { AccountType } from '../entities/account-type.entity';

export interface AccountTypeRepository {
  findAll(options?: unknown, tx?: unknown): Promise<AccountType[]>;
  findById(id: string, tx?: unknown): Promise<AccountType | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateAccountTypeInput, tx?: unknown): Promise<AccountType>;
  update(
    id: string,
    account: UpdateAccountTypeInput,
    tx?: unknown,
  ): Promise<AccountType>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
}
