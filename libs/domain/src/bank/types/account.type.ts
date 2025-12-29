import { BaseQueryParams } from '@app/domain/common';
import { AccountStatus } from '../entities/account.entity';

export type CreateAccountInput = {
  accountTypeId: string;
  name?: string;
  bookCode: string;
  userId: string;
  cardNumber: string;
  bankName: string;
  createdAt: Date;
};

export type UpdateAccountInput = {
  accountTypeId?: string;
  name?: string;
  userId?: string;
  cardNumber?: string;
  bankName?: string;
  status?: AccountStatus;
};

export type ListAccountQueryInput = BaseQueryParams & {
  userId?: string;
  accountTypeId?: string;
  status?: AccountStatus;
};
