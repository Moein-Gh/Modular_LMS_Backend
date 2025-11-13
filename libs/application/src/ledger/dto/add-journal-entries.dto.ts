import { DebitCredit, JournalEntryTarget } from '@app/domain';
import { IsDecimal, IsEnum, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for a single journal entry line item
 */
export class JournalEntryLineItemDto {
  @IsUUID()
  ledgerAccountId!: string;

  @IsEnum(DebitCredit)
  dc!: DebitCredit;

  @IsDecimal({ decimal_digits: '0,4' })
  amount!: string;

  @IsOptional()
  @IsEnum(JournalEntryTarget)
  targetType?: JournalEntryTarget;

  @IsOptional()
  @IsUUID()
  targetId?: string;
}
