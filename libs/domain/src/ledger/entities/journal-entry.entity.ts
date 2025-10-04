import { Journal } from './journal.entity';
import { LedgerAccount } from './ledger-account.entity';

export enum DebitCredit {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface JournalEntry {
  id: string;
  journalId: string;
  ledgerAccountId: string;
  dc: DebitCredit;
  amount: string;
  targetType?: string;
  targetId?: string;
  createdAt: Date;
  journal?: Journal;
  ledgerAccount?: LedgerAccount;
}
