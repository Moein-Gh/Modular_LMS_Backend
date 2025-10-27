import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLoanTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  commissionPercentage: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  defaultInstallments!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxInstallments!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  minInstallments!: number;

  @IsNumber()
  creditRequirementPct: number;

  @IsOptional()
  @IsString()
  description?: string | null;
}
