import { Journal } from './journal.entity';
import { LedgerAccount } from './ledger-account.entity';

export enum DebitCredit {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum JournalTargetType {
  INSTALLMENT = 'INSTALLMENT',
  LOAN = 'LOAN',
  SUBSCRIPTION_FEE = 'SUBSCRIPTION_FEE',
  ACCOUNT = 'ACCOUNT',
  FEE = 'FEE',
  COMMISSION = 'COMMISSION',
  ADJUSTMENT = 'ADJUSTMENT',
  REFUND = 'REFUND',
  REVERSAL = 'REVERSAL',
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
