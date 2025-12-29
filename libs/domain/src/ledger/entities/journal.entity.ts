import { Transaction } from '@app/domain/transaction';
import { JournalEntry } from './journal-entry.entity';

export enum JournalStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED',
}

export interface Journal {
  id: string;
  code: number;
  transactionId?: string;
  postedAt?: Date;
  note?: string;
  status: JournalStatus;
  createdAt: Date;
  updatedAt: Date;

  transaction?: Transaction;
  entries?: JournalEntry[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
