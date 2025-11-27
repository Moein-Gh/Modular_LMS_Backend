import { JournalEntryTarget } from '../entities/journal-entry.entity';

export type CreateJournalEntryInput = {
  journalId: string;
  ledgerAccountId: string;
  dc: 'DEBIT' | 'CREDIT';
  amount: string;
  targetType?: JournalEntryTarget;
  targetId?: string;
  removable?: boolean;
  accountId?: string;
};

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;

export type JournalEntryUpdateManyInput = {
  removable: boolean;
};
