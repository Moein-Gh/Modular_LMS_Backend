import { JournalEntryTarget } from '../entities/journal-entry.entity';

export type CreateJournalEntryInput = {
  journalId: string;
  ledgerAccountId: string;
  dc: 'DEBIT' | 'CREDIT';
  amount: string;
  targetType?: JournalEntryTarget;
  targetId?: string;
};

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;
