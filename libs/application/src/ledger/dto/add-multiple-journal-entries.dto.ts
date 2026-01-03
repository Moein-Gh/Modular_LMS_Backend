import { AllocationType, JournalEntryTarget } from '@app/domain';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class JournalEntryItemDto {
  @IsUUID()
  targetId!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;
}

export class AddMultipleJournalEntriesDto {
  @IsUUID()
  journalId!: string;

  @IsString()
  @IsEnum(AllocationType)
  allocationType!: AllocationType;

  @IsOptional()
  @IsEnum(JournalEntryTarget)
  targetType?: JournalEntryTarget;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryItemDto)
  @ArrayMinSize(1)
  items!: JournalEntryItemDto[];
}
