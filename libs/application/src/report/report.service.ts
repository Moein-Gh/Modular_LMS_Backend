import { BankFinancialSummary, LEDGER_ACCOUNT_CODES } from '@app/domain';
import { PrismaLedgerAccountRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  constructor(
    private readonly ledgerAccountRepo: PrismaLedgerAccountRepository,
  ) {}

  // must return these
  // 1. cash on hand
  // 2. total outstanding loans
  // 3. total loans not returned yet
  // 4. bank balance : all the account balances
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
      computeMetric(LEDGER_ACCOUNT_CODES.CUSTOMER_DEPOSITS),
      computeMetric(LEDGER_ACCOUNT_CODES.LOANS_RECEIVABLE),
      computeMetric(LEDGER_ACCOUNT_CODES.FEE_COMMISSION_INCOME),
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
}
