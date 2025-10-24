import { BankFinancialSummary, LedgerAccountRepository } from '@app/domain';
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
    private readonly ledgerAccountRepo: LedgerAccountRepository,
  ) {}

  /**
   * Get comprehensive financial summary of the bank
   * @param asOfDate - Optional date to calculate balances as of (defaults to now)
   * @param tx - Optional transaction client for consistency
   */
  async getFinancialSummary(
    asOfDate?: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<BankFinancialSummary> {
    // Fetch all balances in parallel for efficiency
    const [cashOnHand, customerDeposits, loansReceivable, totalIncomeEarned] =
      await Promise.all([
        this.getCashBalance(asOfDate, tx),
        this.getCustomerDepositsBalance(asOfDate, tx),
        this.getLoansReceivableBalance(asOfDate, tx),
        this.getTotalIncomeEarned(asOfDate, tx),
      ]);

    // Calculate derived metrics
    const availableForLending = this.calculateAvailableForLending(
      cashOnHand,
      customerDeposits,
    );
    const totalAssets = this.calculateTotalAssets(cashOnHand, loansReceivable);
    const totalLiabilities = customerDeposits;
    const netEquity = this.calculateNetEquity(totalAssets, totalLiabilities);

    return {
      cashOnHand,
      customerDeposits,
      loansReceivable,
      availableForLending,
      totalAssets,
      totalLiabilities,
      netEquity,
      totalIncomeEarned,
      asOfDate: asOfDate ?? new Date(),
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
    return this.ledgerAccountRepo.getAccountBalance(
      LEDGER_ACCOUNTS.CASH,
      asOfDate,
      tx,
    );
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
      asOfDate,
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
      asOfDate,
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
      asOfDate,
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
    const [cash, deposits] = await Promise.all([
      this.getCashBalance(asOfDate, tx),
      this.getCustomerDepositsBalance(asOfDate, tx),
    ]);

    return this.calculateAvailableForLending(cash, deposits);
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

  private calculateAvailableForLending(
    cashOnHand: string,
    customerDeposits: string,
  ): string {
    const cash = parseFloat(cashOnHand);
    const deposits = parseFloat(customerDeposits);
    const available = cash - deposits;

    // Return 0 if negative (bank is overleveraged)
    return (available >= 0 ? available : 0).toFixed(4);
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
