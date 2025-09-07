export type CreateBankInput = {
  name: string;
  subscriptionFee: string; // decimal as string
  commissionPercentage: string; // decimal as string
  accountId?: string;
  defaultMaxInstallments?: number;
  installmentOptions?: number[];
  status?: string;
  currency?: string;
  timeZone?: string;
};

export type UpdateBankInput = {
  name?: string;
  subscriptionFee?: string;
  commissionPercentage?: string;
  defaultMaxInstallments?: number;
  installmentOptions?: number[];
  status?: string;
  currency?: string;
  timeZone?: string;
  accountId?: string | null;
};
