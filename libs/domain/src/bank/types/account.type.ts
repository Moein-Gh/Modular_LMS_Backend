import { AccountStatus } from '../entities/account.entity';

export type CreateAccountInput = {
  accountTypeId: string;
  name?: string;
  userId: string;
  cardNumber: string;
  bankName: string;
};

export type UpdateAccountInput = {
  accountTypeId?: string;
  name?: string;
  userId?: string;
  cardNumber?: string;
  bankName?: string;
  status?: AccountStatus;
};
