import { DebitCredit, JournalEntryTarget } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * DTO for adding a single journal entry to an existing journal
 * Allows adding entries one by one for:
 * - Account balance adjustments
 * - Subscription fee payments
 * - Loan repayments
 * - Commission charges
 *
 * When targetLedgerAccountCode is provided, a balancing entry will be automatically created:
 * - The primary entry uses ledgerAccountCode with the specified dc (DEBIT/CREDIT)
 * - The balancing entry uses targetLedgerAccountCode with the opposite dc
 * - Both entries will have the same targetType and targetId
 *
 * Example: Allocating from Unapplied Receipts (2050) to an Account
 * {
 *   ledgerAccountCode: 2050,
 *   dc: "DEBIT",
 *   amount: 1000,
 *   targetType: "ACCOUNT",
 *   targetId: "account-uuid",
 *   targetLedgerAccountCode: 1050  // Accounts Receivable or similar
 * }
 * Creates:
 * 1. DEBIT 2050 for 1000 (reduce unapplied receipts)
 * 2. CREDIT 1050 for 1000 (increase account receivable)
 */
export class AddSingleJournalEntryDto {
  @Type(() => Number)
  @IsNumber()
  ledgerAccountCode!: number;

  @IsEnum(DebitCredit)
  dc!: DebitCredit;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsEnum(JournalEntryTarget)
  targetType?: JournalEntryTarget;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetLedgerAccountCode?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
