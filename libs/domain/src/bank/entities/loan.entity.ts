import { Account } from '@app/domain';
import type { LoanType } from './loan-type.entity';

export enum LoanStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface Loan {
  id: string;
  name: string;

  accountId: string;
  account?: Account; // relation

  loanTypeId: string;
  loanType?: LoanType; // relation

  amount: string;

  startDate: Date;
  paymentMonths: number;
  status: LoanStatus; // default PENDING

  createdAt: Date;
  updatedAt: Date;
}
