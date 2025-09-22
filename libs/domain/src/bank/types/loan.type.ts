import { Loan, LoanStatus } from '../entities/loan.entity';

export type CreateLoanInput = Pick<
  Loan,
  | 'name'
  | 'accountId'
  | 'userId'
  | 'loanTypeId'
  | 'amount'
  | 'startDate'
  | 'paymentMonths'
> & {
  status?: LoanStatus; // default PENDING if omitted
};

export type UpdateLoanInput = Partial<
  Pick<
    Loan,
    | 'name'
    | 'accountId'
    | 'userId'
    | 'loanTypeId'
    | 'amount'
    | 'startDate'
    | 'paymentMonths'
    | 'status'
  >
>;
