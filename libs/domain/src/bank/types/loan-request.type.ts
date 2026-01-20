import { BaseQueryParams } from '@app/domain/common';
import { LoanQueue } from '../entities/loan-queue.entity';
import {
  LoanRequest,
  LoanRequestStatus,
} from '../entities/loan-request.entity';

export type CreateLoanRequestInput = Pick<
  LoanRequest,
  | 'accountId'
  | 'loanTypeId'
  | 'userId'
  | 'amount'
  | 'startDate'
  | 'paymentMonths'
> & {
  note?: string;
};

export type UpdateLoanRequestInput = Partial<
  Pick<LoanRequest, 'status' | 'note'>
>;

export type ListLoanRequestQueryInput = BaseQueryParams & {
  accountId?: string;
  userId?: string;
  loanTypeId?: string;
  status?: LoanRequestStatus;
};

export type CreateLoanQueueInput = Pick<
  LoanQueue,
  'loanRequestId' | 'queueOrder'
> & {
  adminNotes?: string;
};

export type UpdateLoanQueueInput = Partial<
  Pick<LoanQueue, 'queueOrder' | 'adminNotes'>
>;
