import { LoanBalanceResult } from '@app/application/ledger/dto/journal-balance.dto';
import { Account, User } from '@app/domain';
import type { InstallmentSummary } from '../types/loan.type';
import type { LoanType } from './loan-type.entity';

export enum LoanStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
}

export interface Loan {
  id: string;
  code: number;
  name: string;

  userId: string;
  user?: User;

  accountId: string;
  account?: Account;

  loanTypeId: string;
  loanType?: LoanType;

  amount: string;

  startDate: Date;
  paymentMonths: number;
  status: LoanStatus;

  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  createdBy?: string;

  balanceSummary?: LoanBalanceResult;
  installmentSummary?: InstallmentSummary;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
