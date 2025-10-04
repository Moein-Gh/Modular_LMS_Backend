export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TransactionKind {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  FEE = 'FEE',
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: string;
  status: TransactionStatus;
  externalRef?: string | null;
  note?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
