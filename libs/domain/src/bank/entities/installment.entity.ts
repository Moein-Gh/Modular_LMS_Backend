import { JournalEntry } from '@app/domain/ledger';
import { Loan } from './loan.entity';

export enum InstallmentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  ALLOCATED = 'ALLOCATED',
}

export interface Installment {
  id: string;
  code: number;
  loanId: string;
  installmentNumber: number;
  dueDate: Date;
  amount: string;
  status: InstallmentStatus;
  paymentDate?: Date;
  journalEntryId?: string;

  // relation
  loan?: Loan;
  journalEntry?: JournalEntry;

  // timestamps
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  createdBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
