import { BaseQueryParams } from '@app/domain/common';
import { Loan, LoanStatus } from '../entities/loan.entity';

export type CreateLoanInput = Pick<
  Loan,
  'name' | 'accountId' | 'loanTypeId' | 'amount' | 'startDate' | 'paymentMonths'
> & {
  status?: LoanStatus; // default PENDING if omitted
};

export type UpdateLoanInput = Partial<Pick<Loan, 'name' | 'status'>>;

export type ListLoanQueryInput = BaseQueryParams & {
  accountId?: string;
  userId?: string;
  loanTypeId?: string;
  status?: LoanStatus;
};
