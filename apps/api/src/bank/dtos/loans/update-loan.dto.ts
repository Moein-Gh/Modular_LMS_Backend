import { LoanStatus } from '@app/domain';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateLoanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;
}
