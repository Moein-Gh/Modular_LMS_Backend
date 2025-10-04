type possibleTargetTypes =
  | 'INSTALLMENT'
  | 'LOAN'
  | 'SUBSCRIPTION_FEE'
  | 'ACCOUNT'
  | 'FEE'
  | 'COMMISSION'
  | 'ADJUSTMENT'
  | 'REFUND'
  | 'REVERSAL';

export type CreateJournalEntryInput = {
  journalId: string;
  ledgerAccountId: string;
  dc: 'DEBIT' | 'CREDIT';
  amount: string;
  targetType?: possibleTargetTypes;
  targetId?: string;
};

export type UpdateJournalEntryInput = Partial<CreateJournalEntryInput>;
