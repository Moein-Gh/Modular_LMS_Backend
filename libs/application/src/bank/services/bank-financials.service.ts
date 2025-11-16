import { BankFinancialSummary } from '@app/domain';
import { PrismaLedgerAccountRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

/**
 * Ledger Account Codes
 * These constants reference the standard chart of accounts
 */
const LEDGER_ACCOUNTS = {
  CASH: '1000',
  LOANS_RECEIVABLE: '1100',
  CUSTOMER_DEPOSITS: '2000',
  FEE_INCOME: '4100',
} as const;

/**
 * BankFinancialsService
 *
 * Provides business logic for calculating bank financial metrics
 * Can be used in other services for validation (e.g., checking available cash before loan approval)
 */
@Injectable()
export class BankFinancialsService {
  constructor(
    @Inject('LedgerAccountRepository')
    private readonly ledgerAccountRepo: PrismaLedgerAccountRepository,
  ) {}

  /**
   * Get comprehensive financial summary of the bank
   * @param asOfDate - Optional date to calculate balances as of (defaults to now)
   * @param tx - Optional transaction client for consistency
   */
  async getFinancialSummary(
    startDate?: Date,
    endDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<BankFinancialSummary> {
    const end = endDate ?? new Date();

    // Helper to compute metric for a ledger account
    const computeMetric = async (accountCode: string) => {
      // Determine earliest available date if startDate not provided
      let effectiveStart = startDate;
      if (!effectiveStart) {
        const earliest = await this.ledgerAccountRepo.getEarliestPostedDate(
          accountCode,
          tx,
        );
        if (earliest) effectiveStart = earliest;
      }

      // If still no start (no history), treat single-point series at end
      if (!effectiveStart) {
        const todayVal = await this.ledgerAccountRepo.getAccountBalance(
          accountCode,
          { endDate: end },
          tx,
        );
        return {
          lastMonth: todayVal,
          monthlyAverage: todayVal,
          today: todayVal,
        };
      }

      // Build month-end dates between effectiveStart and end inclusive
      const monthEnds: Date[] = [];
      const s = new Date(effectiveStart);
      s.setUTCDate(1);
      s.setUTCHours(0, 0, 0, 0);
      const e = new Date(end);
      e.setUTCHours(23, 59, 59, 999);

      let iter = new Date(s);
      // move iter to end of its month
      iter = new Date(
        Date.UTC(
          iter.getUTCFullYear(),
          iter.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      );
      while (iter <= e) {
        monthEnds.push(new Date(iter));
        // advance one month
        iter = new Date(
          Date.UTC(
            iter.getUTCFullYear(),
            iter.getUTCMonth() + 2,
            0,
            23,
            59,
            59,
            999,
          ),
        );
      }

      // If no month ends found (start after end), use single point at end
      if (monthEnds.length === 0) {
        const val = await this.ledgerAccountRepo.getAccountBalance(
          accountCode,
          { endDate: e },
          tx,
        );
        return { lastMonth: val, monthlyAverage: val, today: val };
      }

      // Fetch balances for each month end in parallel
      const balances = await Promise.all(
        monthEnds.map((d) =>
          this.ledgerAccountRepo.getAccountBalance(
            accountCode,
            { endDate: d },
            tx,
          ),
        ),
      );

      // Compute monthly average
      const numeric = balances.map((v) => parseFloat(v));
      const sum = numeric.reduce((a, b) => a + b, 0);
      const avg = sum / numeric.length;

      // Compute last month's value relative to the provided end date
      const lastMonthEnd = new Date(
        Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 0, 23, 59, 59, 999),
      );
      // If lastMonthEnd < first month end, use first month's value
      let lastMonthVal: string;
      if (lastMonthEnd < monthEnds[0]) {
        lastMonthVal = balances[0];
      } else {
        // Try to find existing month end match
        const idx = monthEnds.findIndex(
          (d) => d.getTime() === lastMonthEnd.getTime(),
        );
        if (idx >= 0) lastMonthVal = balances[idx];
        else {
          // fetch directly
          lastMonthVal = await this.ledgerAccountRepo.getAccountBalance(
            accountCode,
            { endDate: lastMonthEnd },
            tx,
          );
        }
      }

      const todayVal = await this.ledgerAccountRepo.getAccountBalance(
        accountCode,
        { endDate: end },
        tx,
      );

      return {
        lastMonth: lastMonthVal,
        monthlyAverage: avg.toFixed(4),
        today: todayVal,
      };
    };

    // Compute metrics for underlying accounts in parallel
    const [depositsMetric, loansMetric, incomeMetric] = await Promise.all([
      computeMetric(LEDGER_ACCOUNTS.CUSTOMER_DEPOSITS),
      computeMetric(LEDGER_ACCOUNTS.LOANS_RECEIVABLE),
      computeMetric(LEDGER_ACCOUNTS.FEE_INCOME),
    ]);

    // Derive cashOnHand metrics as deposits - loans per metric element
    const derive = (a: string, b: string) => {
      const v = parseFloat(a) - parseFloat(b);
      return (v >= 0 ? v : 0).toFixed(4);
    };

    const cashMetric = {
      lastMonth: derive(depositsMetric.lastMonth, loansMetric.lastMonth),
      monthlyAverage: derive(
        depositsMetric.monthlyAverage,
        loansMetric.monthlyAverage,
      ),
      today: derive(depositsMetric.today, loansMetric.today),
    };

    return {
      cashOnHand: cashMetric,
      customerDeposits: depositsMetric,
      loansReceivable: loansMetric,
      totalIncomeEarned: incomeMetric,
      asOfDate: end,
    };
  }

  /**
   * Get current cash balance (Account 1000)
   * This is the total physical/digital money the bank holds
   */
  async getCashBalance(
    asOfDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    // Cash on hand is defined as: customer deposits - outstanding loans
    const [deposits, loans] = await Promise.all([
      this.getCustomerDepositsBalance(asOfDate, tx),
      this.getLoansReceivableBalance(asOfDate, tx),
    ]);

    const depositVal = parseFloat(deposits);
    const loansVal = parseFloat(loans);
    const cash = depositVal - loansVal;

    return (cash >= 0 ? cash : 0).toFixed(4);
  }

  /**
   * Get customer deposits balance (Account 2000)
   * This represents money customers can withdraw
   */
  async getCustomerDepositsBalance(
    asOfDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    return this.ledgerAccountRepo.getAccountBalance(
      LEDGER_ACCOUNTS.CUSTOMER_DEPOSITS,
      asOfDate ? { endDate: asOfDate } : undefined,
      tx,
    );
  }

  /**
   * Get loans receivable balance (Account 1100)
   * This represents outstanding loans that customers owe
   */
  async getLoansReceivableBalance(
    asOfDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    return this.ledgerAccountRepo.getAccountBalance(
      LEDGER_ACCOUNTS.LOANS_RECEIVABLE,
      asOfDate ? { endDate: asOfDate } : undefined,
      tx,
    );
  }

  /**
   * Get total income earned (Account 4100)
   * Revenue from fees, commissions, and interest
   */
  async getTotalIncomeEarned(
    asOfDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    return this.ledgerAccountRepo.getAccountBalance(
      LEDGER_ACCOUNTS.FEE_INCOME,
      asOfDate ? { endDate: asOfDate } : undefined,
      tx,
    );
  }

  /**
   * Calculate available cash for lending
   * This is the critical metric for loan approval validation
   * @returns Cash - Customer Deposits (money that can be safely lent)
   */
  async getAvailableForLending(
    asOfDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<string> {
    const cash = await this.getCashBalance(asOfDate, tx);
    return this.calculateAvailableForLending(cash);
  }

  /**
   * Check if bank has sufficient funds to approve a loan
   * Use this method in loan approval validation
   * @param loanAmount - Amount requested for loan
   * @param tx - Optional transaction client
   * @returns true if bank has enough available cash
   */
  async canApproveLoan(
    loanAmount: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const availableForLending = await this.getAvailableForLending(
      undefined,
      tx,
    );
    const available = parseFloat(availableForLending);
    const requested = parseFloat(loanAmount);

    return available >= requested;
  }

  // Private helper methods for calculations

  private calculateAvailableForLending(cashOnHand: string): string {
    const cash = parseFloat(cashOnHand);
    // available for lending is the cash on hand (already net of loans)
    return (cash >= 0 ? cash : 0).toFixed(4);
  }

  private calculateTotalAssets(
    cashOnHand: string,
    loansReceivable: string,
  ): string {
    const cash = parseFloat(cashOnHand);
    const loans = parseFloat(loansReceivable);
    return (cash + loans).toFixed(4);
  }

  private calculateNetEquity(
    totalAssets: string,
    totalLiabilities: string,
  ): string {
    const assets = parseFloat(totalAssets);
    const liabilities = parseFloat(totalLiabilities);
    return (assets - liabilities).toFixed(4);
  }
}
