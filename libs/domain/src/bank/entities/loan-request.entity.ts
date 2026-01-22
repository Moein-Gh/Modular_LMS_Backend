import type { User } from '../../user/entities/user.entity';
import type { Account } from './account.entity';
import type { LoanType } from './loan-type.entity';

export enum LoanRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED',
}

export interface LoanRequest {
  id: string;
  code: number;

  accountId: string;
  account?: Account;

  loanTypeId: string;
  loanType?: LoanType;

  userId: string;
  user?: User;

  amount: string;
  startDate: Date;
  paymentMonths: number;

  status: LoanRequestStatus;
  note?: string;

  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  createdBy?: string;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
