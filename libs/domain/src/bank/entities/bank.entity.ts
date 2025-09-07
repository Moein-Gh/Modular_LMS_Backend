export interface Bank {
  id: string; // UUID
  name: string;
  subscriptionFee: string; // decimal as string to avoid precision loss
  commissionPercentage: string; // decimal as string
  defaultMaxInstallments: number;

  installmentOptions: number[];
  status: string; // e.g., 'active'
  currency: string; // e.g., 'Toman'
  timeZone: string; // e.g., 'Asia/Tehran'

  accountId?: string;

  createdAt: Date;
  updatedAt: Date;
}
