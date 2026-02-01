import { BaseQueryParams } from '@app/domain/common';
import { Loan, LoanStatus } from '../entities/loan.entity';

export interface InstallmentSummary {
  /** Total number of installments */
  totalCount: number;
  /** Number of installments that have been paid */
  paidCount: number;
  /** Number of installments that should have been paid by now (based on due date) */
  overdueCount: number;
  /** Number of active unpaid installments */
  activeCount: number;
  /** Number of pending installments */
  pendingCount: number;
  /** Total amount of all installments */
  totalAmount: string;
  /** Total amount paid */
  amountPaid: string;
  /** Amount that should have been paid by now (based on due dates) */
  amountOverdue: string;
  /** Remaining amount to be paid */
  amountRemaining: string;
  /** Percentage of amount paid (0-100) */
  paymentPercentage: number;
  /** Expected completion date (due date of last installment) */
  expectedCompletionDate: Date | null;
  /** Next unpaid installment due date */
  nextInstallmentDate: Date | null;
  /** Next unpaid installment amount */
  nextInstallmentAmount: string | null;
  /** Next unpaid installment number */
  nextInstallmentNumber: number | null;
}

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
