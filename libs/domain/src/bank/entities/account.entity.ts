import { AccountBalanceResult } from '@app/application/ledger/dto/journal-balance.dto';
import { AccountType, User } from '@app/domain';

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESTRICTED = 'restricted',
}

export interface Account {
  id: string;
  code: number;
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

  balanceSummary?: AccountBalanceResult;
}
