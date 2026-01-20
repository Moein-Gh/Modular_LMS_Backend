import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateLoanRequestDto {
  @ApiProperty({ description: 'Account ID requesting the loan' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ description: 'Loan type ID' })
  @IsUUID()
  @IsNotEmpty()
  loanTypeId: string;

  @ApiProperty({ description: 'User ID creating the request' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Loan amount requested', example: '1000000' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: 'Loan start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Number of payment months',
    example: 12,
    minimum: 1,
    maximum: 120,
  })
  @IsInt()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  paymentMonths: number;

  @ApiPropertyOptional({ description: 'Optional note from user' })
  @IsString()
  @IsOptional()
  note?: string;
}
