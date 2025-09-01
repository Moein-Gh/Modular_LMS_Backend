import { User } from '@app/domain';
import { AccountType } from '@app/domain';

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESTRICTED = 'restricted',
}

export interface Account {
  id: string;
  accountTypeId: string;
  name: string;
  userId: string;
  cardNumber: string;
  bankName: string;
  status: AccountStatus;

  createdAt: Date;
  updatedAt: Date;

  accountType?: AccountType;
  user?: User;
}
