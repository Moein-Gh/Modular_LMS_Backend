import { JournalEntry } from '@app/domain/ledger';
import { Account } from './account.entity';

export enum SubscriptionFeeStatus {
  DUE = 'DUE',
  PAID = 'PAID',
  ALLOCATED = 'ALLOCATED',
}

export interface SubscriptionFee {
  id: string;
  code: number;
  accountId: string;
  journalEntryId?: string;
  periodStart: Date;
  amount: string;
  status: SubscriptionFeeStatus;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  createdBy?: string;

  // relation
  account?: Account;
  journalEntry?: JournalEntry;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
