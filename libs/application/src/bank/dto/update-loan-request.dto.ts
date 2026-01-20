import { LoanRequestStatus } from '@app/domain';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateLoanRequestDto {
  @ApiPropertyOptional({ description: 'Loan amount' })
  @IsString()
  @IsOptional()
  amount?: string;

  @ApiPropertyOptional({ description: 'Loan start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Number of payment months' })
  @IsInt()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  @IsOptional()
  paymentMonths?: number;

  @ApiPropertyOptional({ description: 'User note' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Request status',
    enum: LoanRequestStatus,
  })
  @IsEnum(LoanRequestStatus)
  @IsOptional()
  status?: LoanRequestStatus;
}
