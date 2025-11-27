import { BaseQueryParams } from '@app/domain/common';
import { SubscriptionFeeStatus } from '../entities/subscription-fee.entity';

export type CreateSubscriptionFeeInput = {
  accountId: string;
  periodStart: Date;
  amount: string;
  dueDate?: Date;
  status?: SubscriptionFeeStatus;
};

export type UpdateSubscriptionFeeInput = {
  periodStart?: Date;
  amount?: string;
  dueDate?: Date | null;
  paidAt?: Date | null;
  status?: SubscriptionFeeStatus;
  journalEntryId?: string | null;
};

export type ListSubscriptionFeeQueryInput = BaseQueryParams & {
  accountId?: string;
  userId?: string;
  status?: SubscriptionFeeStatus;
  periodStart?: Date;
};
