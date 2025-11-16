/**
 * Bank Financial Summary
 * Provides a comprehensive view of the bank's financial position
 * Calculated from ledger account balances
 */
export interface FinancialMetric {
  lastMonth: string;
  monthlyAverage: string;
  today: string;
}

export interface BankFinancialSummary {
  /**
   * Total cash on hand (Balance of Cash account - 1000)
   * This is the physical/digital money the bank currently holds
   */
  cashOnHand: FinancialMetric;

  /**
   * Total customer deposits (Balance of Customer Deposits account - 2000)
   * Money that customers have deposited and can withdraw
   */
  customerDeposits: FinancialMetric;

  /**
   * Total outstanding loans (Balance of Loans Receivable account - 1100)
   * Money that has been lent out and is expected to be repaid
   */
  loansReceivable: FinancialMetric;

  /**
   * Cash available for new loans
   * Calculated as: cashOnHand - customerDeposits
   * This represents money the bank can safely lend without risking liquidity
   */
  // Removed: availableForLending, totalAssets, totalLiabilities, netEquity

  /**
   * Total income earned (Balance of Fee/Commission Income account - 4100)
   * Revenue from fees, commissions, and interest
   */
  totalIncomeEarned: FinancialMetric;

  /**
   * Date and time when this summary was calculated
   */
  asOfDate: Date;
}
