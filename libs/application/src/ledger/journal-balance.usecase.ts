import { AccountStatus, DebitCredit, LoanStatus } from '@app/domain';
import {
  PrismaAccountRepository,
  PrismaJournalEntryRepository,
  PrismaLoanRepository,
} from '@app/infra';
import { JournalTargetType, Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import {
  AccountBalanceResult,
  LoanBalanceResult,
} from './dto/journal-balance.dto';

@Injectable()
export class JournalBalanceUsecase {
  constructor(
    private readonly accountRepository: PrismaAccountRepository,
    @Inject('JournalEntryRepository')
    private readonly journalEntryRepository: PrismaJournalEntryRepository,
    private readonly loanRepository: PrismaLoanRepository,
  ) {}

  async getAccountBalance(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountBalanceResult> {
    const accountEntries = await this.journalEntryRepository.findAll(
      {
        where: {
          accountId,
          journal: {
            status: 'POSTED',
          },
          ledgerAccount: {
            code: '2000',
          },
          targetType: JournalTargetType.ACCOUNT,
          targetId: accountId,
        },
      },
      tx,
    );
    const feeEntries = await this.journalEntryRepository.findAll(
      {
        where: {
          accountId,
          journal: {
            status: 'POSTED',
          },
          ledgerAccount: {
            code: '2000',
          },
          targetType: JournalTargetType.SUBSCRIPTION_FEE,
        },
      },
      tx,
    );

    const accountAmount = accountEntries.reduce<number>(
      (sum, entry) =>
        entry.dc === DebitCredit.CREDIT
          ? sum + Number(entry.amount)
          : sum - Number(entry.amount),
      0,
    );

    const feeAmount = feeEntries.reduce<number>(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    const totalAmount = accountAmount + feeAmount;
    return {
      accountId,
      accountDeposits: {
        count: accountEntries.length,
        amount: accountAmount,
      },
      subscriptionFeeDeposits: {
        count: feeEntries.length,
        amount: feeAmount,
      },
      totalDeposits: totalAmount,
    };
  }

  async getLoanBalance(
    loanId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanBalanceResult> {
    const loanEntries = await this.journalEntryRepository.findAll(
      {
        where: {
          journal: { status: 'POSTED' },
          ledgerAccount: { code: '1100' },
          OR: [
            { targetType: JournalTargetType.LOAN, targetId: loanId },
            {
              targetType: JournalTargetType.INSTALLMENT,
              installments: {
                some: { loanId },
              },
            },
          ],
        },
      },
      tx,
    );

    const loanAmount = loanEntries
      .filter((entry) => entry.dc === DebitCredit.DEBIT)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const repaymentAmount = loanEntries
      .filter((entry) => entry.dc === DebitCredit.CREDIT)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    // Count repayment installments based on CREDIT entries (repayments),
    // so the initial disbursement (a DEBIT) is not counted.
    const installmentCounts = loanEntries.filter(
      (entry) => entry.dc === DebitCredit.CREDIT,
    ).length;

    const outstandingBalance = loanAmount - repaymentAmount;

    return {
      loanId,
      loanAmount,
      repayments: {
        count: installmentCounts,
        amount: repaymentAmount,
      },
      outstandingBalance,
      paidPercentage:
        loanAmount > 0
          ? Number((repaymentAmount * 10000) / loanAmount) / 100
          : 0,
    };
  }

  async getUserAccountsBalance(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AccountBalanceResult[]> {
    const accounts = await this.accountRepository.findAll(
      {
        where: {
          userId,
          status: { not: AccountStatus.INACTIVE },
        },
      },
      tx,
    );

    const balances = await Promise.all(
      accounts.map((account) => this.getAccountBalance(account.id, tx)),
    );

    return balances;
  }

  async getUserLoansBalance(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanBalanceResult[]> {
    const loans = await this.loanRepository.findAll(
      {
        where: {
          account: { userId },
          status: LoanStatus.ACTIVE,
        },
      },
      tx,
    );

    const balances = await Promise.all(
      loans.map((loan) => this.getLoanBalance(loan.id, tx)),
    );

    return balances;
  }
}
