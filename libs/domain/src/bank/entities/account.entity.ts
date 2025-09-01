import { User } from '@app/domain';
import { AccountType } from '@app/domain';

export interface Account {
  id: string;
  accountTypeId: string;
  name: string;
  userId: string;
  cardNumber: string;
  bankName: string;
  status: string;

  createdAt: Date;
  updatedAt: Date;

  accountType: AccountType;
  user: User;
}
