import { JournalEntryTarget } from '../entities/journal-entry.entity';

export type CreateJournalEntryInput = {
  journalId: string;
  ledgerAccountId: string;
  dc: 'DEBIT' | 'CREDIT';
  amount: string;
  targetType?: JournalEntryTarget;
  targetId?: string;
  removable?: boolean;
};

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;
