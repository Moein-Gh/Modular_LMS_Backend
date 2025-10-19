import { User } from '@app/domain/user';
import { TransactionImage } from '@generated/prisma';

export type TransactionKind =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT'
  | 'SUBSCRIPTION_PAYMENT'
  | 'FEE';

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: string;
  status: TransactionStatus;
  externalRef?: string | null;
  note?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: User;
  images: TransactionImage[];
}
