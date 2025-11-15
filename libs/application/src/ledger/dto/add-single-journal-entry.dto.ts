import { AllocationType, JournalEntryTarget } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class AddSingleJournalEntryDto {
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

  @IsString()
  @IsEnum(AllocationType)
  allocationType!: AllocationType;

  @IsOptional()
  @IsString()
  note?: string;
}
