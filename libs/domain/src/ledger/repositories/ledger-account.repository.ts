import { LedgerAccount } from '../entities/ledger-account.entity';
import {
  CreateLedgerAccountInput,
  UpdateLedgerAccountInput,
} from '../types/ledger-account.type';

export interface LedgerAccountRepository {
  findAll(options?: unknown, tx?: unknown): Promise<LedgerAccount[]>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  findById(id: string, tx?: unknown): Promise<LedgerAccount | null>;
  findByCode(code: string, tx?: unknown): Promise<LedgerAccount | null>;
  create(input: CreateLedgerAccountInput, tx?: unknown): Promise<LedgerAccount>;
  update(
    id: string,
    input: UpdateLedgerAccountInput,
    tx?: unknown,
  ): Promise<LedgerAccount>;
  delete(id: string, tx?: unknown): Promise<void>;
  /**
   * Calculate the balance of a ledger account based on its journal entries.
   * For ASSET accounts: Balance = Total Debits - Total Credits
   * For LIABILITY/EQUITY/INCOME accounts: Balance = Total Credits - Total Debits
   * For EXPENSE accounts: Balance = Total Debits - Total Credits
   * @param accountCode - The account code (e.g., '1000' for Cash)
   * @param asOfDate - Optional date to calculate balance up to (inclusive)
   * @param tx - Optional transaction client
   * @returns The calculated balance as a string (to preserve decimal precision)
   */
  getAccountBalance(
    accountCode: string,
    asOfDate?: Date,
    tx?: unknown,
  ): Promise<string>;
}
