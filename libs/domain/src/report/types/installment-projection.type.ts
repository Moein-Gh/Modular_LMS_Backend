import { Installment } from '../../bank/entities/installment.entity';
import { Loan } from '../../bank/entities/loan.entity';
import { User } from '../../user/entities/user.entity';

export interface InstallmentWithDetails extends Installment {
  loan: Loan & {
    user: User;
  };
}

export interface InstallmentGroup {
  count: number;
  totalAmount: string;
  installments: InstallmentWithDetails[];
}

export interface MonthlyInstallmentProjection {
  expected: InstallmentGroup;
  paid: InstallmentGroup;
  pending: InstallmentGroup;
}

export interface InstallmentProjectionsResponse {
  currentMonth: MonthlyInstallmentProjection;
  nextMonth: InstallmentGroup;
  next3Months: InstallmentGroup;
}
