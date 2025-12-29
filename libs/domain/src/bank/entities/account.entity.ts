import { AccountBalanceResult } from '@app/application/ledger/dto/journal-balance.dto';
import { AccountType, User } from '@app/domain';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BUSY = 'BUSY',
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
  bookCode?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  createdBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  accountType?: AccountType;
  user?: User;

  balanceSummary?: AccountBalanceResult;
}
