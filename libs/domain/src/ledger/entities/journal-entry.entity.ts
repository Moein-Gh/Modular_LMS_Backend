import { Journal } from './journal.entity';
import { LedgerAccount } from './ledger-account.entity';

export enum DebitCredit {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum JournalEntryTarget {
  INSTALLMENT = 'INSTALLMENT',
  LOAN = 'LOAN',
  SUBSCRIPTION_FEE = 'SUBSCRIPTION_FEE',
  ACCOUNT = 'ACCOUNT',
}

export interface JournalEntry {
  id: string;
  code: number;
  journalId: string;
  ledgerAccountId: string;
  dc: DebitCredit;
  amount: string;
  targetType?: JournalEntryTarget;
  targetId?: string;
  removable: boolean;
  createdAt: Date;
  accountId?: string;
  journal?: Journal;
  ledgerAccount?: Partial<LedgerAccount>;
}
