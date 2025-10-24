/**
 * Bank Financial Summary
 * Provides a comprehensive view of the bank's financial position
 * Calculated from ledger account balances
 */
export interface BankFinancialSummary {
  /**
   * Total cash on hand (Balance of Cash account - 1000)
   * This is the physical/digital money the bank currently holds
   */
  cashOnHand: string;

  /**
   * Total customer deposits (Balance of Customer Deposits account - 2000)
   * Money that customers have deposited and can withdraw
   */
  customerDeposits: string;

  /**
   * Total outstanding loans (Balance of Loans Receivable account - 1100)
   * Money that has been lent out and is expected to be repaid
   */
  loansReceivable: string;

  /**
   * Cash available for new loans
   * Calculated as: cashOnHand - customerDeposits
   * This represents money the bank can safely lend without risking liquidity
   */
  availableForLending: string;

  /**
   * Total assets (cashOnHand + loansReceivable)
   * All resources owned by the bank
   */
  totalAssets: string;

  /**
   * Total liabilities (customerDeposits)
   * All obligations owed to others
   */
  totalLiabilities: string;

  /**
   * Net equity (totalAssets - totalLiabilities)
   * The bank's net worth
   */
  netEquity: string;

  /**
   * Total income earned (Balance of Fee/Commission Income account - 4100)
   * Revenue from fees, commissions, and interest
   */
  totalIncomeEarned: string;

  /**
   * Date and time when this summary was calculated
   */
  asOfDate: Date;
}
