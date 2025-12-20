import { SubscriptionFeeStatus } from '@app/domain';

export type PrismaSubscriptionFeeCreateInput = {
  accountId: string;
  periodStart: Date;
  amount: string;
  status: SubscriptionFeeStatus;
};
