import { DebitCredit, JournalStatus } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class JournalEntryLineDto {
  @IsString()
  ledgerAccountId!: string;

  @IsEnum(DebitCredit)
  dc!: DebitCredit;

  @IsString()
  amount!: string; // decimal as string

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;
}

export class CreateJournalDto {
  @IsString()
  transactionId!: string;

  @IsOptional()
  @IsDateString()
  postedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(JournalStatus)
  status?: JournalStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  entries!: JournalEntryLineDto[];
}

export { JournalEntryLineDto };
