import { Transaction } from '@app/domain/transaction';
import { DebitCredit, JournalEntry } from '../entities/journal-entry.entity';
import type { Journal } from '../entities/journal.entity';
import { JournalStatus } from '../entities/journal.entity';

export interface CreateJournalEntryLine {
  ledgerAccountId: string;
  dc: DebitCredit;
  amount: string;
  targetType?: string;
  targetId?: string;
  transaction?: Transaction;
}

export interface CreateJournalInput {
  transactionId: string;
  postedAt?: Date;
  note?: string;
  status?: JournalStatus;
}

export type JournalWithEntries = Journal & { entries: JournalEntry[] };
