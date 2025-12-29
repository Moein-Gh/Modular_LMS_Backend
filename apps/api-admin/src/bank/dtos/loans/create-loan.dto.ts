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

export class CreateLoanDto {
  @IsString()
  name!: string;

  @IsUUID('4')
  accountId!: string;

  @IsUUID('4')
  userId!: string;

  @IsUUID('4')
  loanTypeId!: string;

  @IsString()
  amount!: string;

  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMonths!: number;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;
}
