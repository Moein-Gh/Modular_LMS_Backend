import { LoanStatus } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateLoanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID('4')
  accountId?: string;

  @IsOptional()
  @IsUUID('4')
  loanTypeId?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMonths?: number;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;
}
