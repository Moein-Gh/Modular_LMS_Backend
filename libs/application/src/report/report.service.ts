import { DateService } from '@app/date';
import {
  AccountStatus,
  BankFinancialSummary,
  LEDGER_ACCOUNT_CODES,
  LoanStatus,
} from '@app/domain';
import {
  PrismaAccountRepository,
  PrismaLedgerAccountRepository,
  PrismaLoanRepository,
  PrismaTransactionRepository,
  PrismaUserRepository,
} from '@app/infra';
import { Prisma, TransactionStatus } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  constructor(
    private readonly ledgerAccountRepo: PrismaLedgerAccountRepository,
    private readonly usersRepo: PrismaUserRepository,
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly loansRepo: PrismaLoanRepository,
    private readonly transactionsRepo: PrismaTransactionRepository,
    private readonly dateService: DateService,
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

    const format = (val: string | number) => {
      return parseFloat(Number(val).toFixed(4)).toString();
    };

    // Example usage:
    // const now = new Date();
    // const jalaliNow = newDate(
    //   now.getFullYear(),
    //   now.getMonth() + 1,
    //   now.getDate(),
    // );
    // console.log('Jalali now:', jalaliNow);
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
        const formatted = format(todayVal);
        return {
          lastMonth: formatted,
          monthlyAverage: formatted,
          today: formatted,
        };
      }

      // Build month-end dates between effectiveStart and end inclusive
      const monthEnds: Date[] = [];
      const s = this.dateService.startOfMonth(effectiveStart);
      const e = this.dateService.endOfDay(end);

      let iter = this.dateService.endOfMonth(s);
      while (iter <= e) {
        monthEnds.push(new Date(iter));
        // advance one month
        iter = this.dateService.endOfMonth(this.dateService.addMonths(iter, 1));
      }

      // If no month ends found (start after end), use single point at end
      if (monthEnds.length === 0) {
        const val = await this.ledgerAccountRepo.getAccountBalance(
          accountCode,
          { endDate: e },
          tx,
        );
        const formatted = format(val);
        return {
          lastMonth: formatted,
          monthlyAverage: formatted,
          today: formatted,
        };
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
      const lastMonthEnd = this.dateService.endOfMonth(
        this.dateService.subMonths(e, 1),
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
        lastMonth: format(lastMonthVal),
        monthlyAverage: format(avg),
        today: format(todayVal),
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
      return format(v >= 0 ? v : 0);
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

  // must return these counts
  // 1. total users
  // 2. total accounts (active , restricted)
  // 3. total loans (total , active , pending)
  // 4. total transactions (total , pending)
  async getEntitesSummary() {
    const users = await this.usersRepo.count({
      isDeleted: false,
    });

    const accountsTotal = await this.accountsRepo.count({ isDeleted: false });

    const accountsRestricted = await this.accountsRepo.count({
      status: AccountStatus.BUSY,
      isDeleted: false,
    });

    const accountActive = await this.accountsRepo.count({
      status: AccountStatus.ACTIVE,
      isDeleted: false,
    });

    const loansTotal = await this.loansRepo.count({ isDeleted: false });

    const loansActive = await this.loansRepo.count({
      status: LoanStatus.ACTIVE,
      isDeleted: false,
    });

    const loansPending = await this.loansRepo.count({
      status: LoanStatus.PENDING,
      isDeleted: false,
    });

    const transactionsTotal = await this.transactionsRepo.count({
      isDeleted: false,
    });

    const transactionsPending = await this.transactionsRepo.count({
      status: TransactionStatus.PENDING,
      isDeleted: false,
    });

    const transactionsAllocated = await this.transactionsRepo.count({
      status: TransactionStatus.ALLOCATED,
      isDeleted: false,
    });

    return {
      users,
      accounts: {
        total: accountsTotal,
        active: accountActive,
        restricted: accountsRestricted,
      },
      loans: {
        total: loansTotal,
        active: loansActive,
        pending: loansPending,
      },

      transactions: {
        total: transactionsTotal,
        pending: transactionsPending,
        allocated: transactionsAllocated,
      },
    };
  }
}
