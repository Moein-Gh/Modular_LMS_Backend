import { Loan } from './loan.entity';

export enum InstallmentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
}

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: Date;
  amount: string;
  status: InstallmentStatus;
  paymentDate?: Date;

  // relation
  loan?: Loan;

  // timestamps
  createdAt: Date;
  updatedAt: Date;
}
