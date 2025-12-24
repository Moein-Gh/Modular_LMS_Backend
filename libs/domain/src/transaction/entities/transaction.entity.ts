import { User } from '@app/domain/user';
import { TransactionImage } from '@generated/prisma';

export enum TransactionKind {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ALLOCATED = 'ALLOCATED',
}

export interface Transaction {
  id: string;
  code: number;
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
