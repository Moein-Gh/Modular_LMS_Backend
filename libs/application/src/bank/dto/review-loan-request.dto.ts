import { LoanRequestStatus } from '@app/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewLoanRequestDto {
  @ApiProperty({
    description: 'Review decision',
    enum: [LoanRequestStatus.APPROVED, LoanRequestStatus.REJECTED],
  })
  @IsIn([LoanRequestStatus.APPROVED, LoanRequestStatus.REJECTED])
  @IsNotEmpty()
  status: LoanRequestStatus;

  @ApiPropertyOptional({ description: 'Admin review note' })
  @IsString()
  @IsOptional()
  note?: string;
}
