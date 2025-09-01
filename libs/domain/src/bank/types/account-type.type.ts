import { AccountType } from '@app/domain';

export type CreateAccountTypeInput = Pick<AccountType, 'name'>;
export type UpdateAccountTypeInput = Omit<
  AccountType,
  'id' | 'createdAt' | 'updatedAt'
>;
