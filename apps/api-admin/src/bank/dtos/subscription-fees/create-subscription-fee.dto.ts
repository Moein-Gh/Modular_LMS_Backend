import { SubscriptionFeeStatus } from '@app/domain';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateSubscriptionFeeDto {
  @ApiProperty()
  @IsUUID()
  accountId!: string;

  @ApiProperty()
  @IsDateString()
  periodStart!: Date;

  @ApiProperty({ description: 'Decimal as string' })
  @IsString()
  amount!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({ required: false, enum: SubscriptionFeeStatus })
  @IsOptional()
  @IsEnum(SubscriptionFeeStatus)
  status?: SubscriptionFeeStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  journalEntryId?: string;
}
