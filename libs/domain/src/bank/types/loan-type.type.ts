import { LoanType } from '../entities/loan-type.entity';

export type CreateLoanTypeInput = Pick<
  LoanType,
  | 'name'
  | 'commissionPercentage'
  | 'defaultInstallments'
  | 'maxInstallments'
  | 'minInstallments'
  | 'creditRequirementPct'
  | 'description'
>;

export type UpdateLoanTypeInput = Partial<
  Omit<LoanType, 'id' | 'createdAt' | 'updatedAt'>
>;
