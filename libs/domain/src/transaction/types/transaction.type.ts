type TransactionKind =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT'
  | 'SUBSCRIPTION_PAYMENT'
  | 'FEE';

type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type CreateTransactionInput = {
  id: string;
  userId: string;
  kind: TransactionKind;
  amount: string;
  externalRef?: string | null;
  note?: string | null;
  status: TransactionStatus;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;
