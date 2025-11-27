export type DipositDetails = {
  count: number;
  amount: number;
};

export type AccountBalanceResult = {
  accountId: string;
  accountDeposits: DipositDetails;
  subscriptionFeeDeposits: DipositDetails;
  totalDeposits: number;
};

export type LoanBalanceResult = {
  loanId: string;
  loanAmount: number;
  repayments: DipositDetails;
  outstandingBalance: number;
  paidPercentage: number;
};
