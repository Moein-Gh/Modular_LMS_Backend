import { Account } from './account.entity';

export enum SubscriptionFeeStatus {
  DUE = 'DUE',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

export interface SubscriptionFee {
  id: string;
  code: number;
  accountId: string;
  periodStart: Date;
  amount: string;
  status: SubscriptionFeeStatus;
  dueDate?: Date;
  paidAt?: Date;
  waivedAt?: Date;
  waiverReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // relation
  account?: Account;
}
