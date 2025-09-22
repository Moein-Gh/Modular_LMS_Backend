import { Type } from 'class-transformer';
import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLoanTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  // Decimal represented as string (aligns with domain entity)
  @IsString()
  @IsDecimal()
  commissionPercentage!: string;

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

  // Percentage (0-100) as decimal string; stored as string in domain
  @IsString()
  @IsDecimal()
  creditRequirementPct!: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
