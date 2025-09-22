import { Account, User } from '@app/domain';
import type { LoanType } from './loan-type.entity';

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  DEFAULTED = 'DEFAULTED',
}

export interface Loan {
  id: string; // UUID
  name: string;

  accountId: string;
  account?: Account; // relation

  userId: string;
  user?: User; // relation

  loanTypeId: string;
  loanType?: LoanType; // relation

  amount: string; // Decimal(18,4) as string

  startDate: Date;
  paymentMonths: number;
  status: LoanStatus; // default PENDING

  createdAt: Date;
  updatedAt: Date;
}
