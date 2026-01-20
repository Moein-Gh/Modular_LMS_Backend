import { LoanRequest } from './loan-request.entity';

export interface LoanQueue {
  id: string;
  code: number;
  loanRequestId: string;
  loanRequest?: LoanRequest;
  queueOrder: number;
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;

  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
