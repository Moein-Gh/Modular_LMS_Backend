import { ApiProperty } from '@nestjs/swagger';

export class UserOverviewDto {
  @ApiProperty({
    description: 'Number of active accounts',
    example: 3,
  })
  activeAccountsCount!: number;

  @ApiProperty({
    description: 'Total balance across all active accounts',
    example: '15000000.0000',
  })
  totalAccountBalance!: string;

  @ApiProperty({
    description: 'Number of active loans',
    example: 2,
  })
  activeLoansCount!: number;

  @ApiProperty({
    description: 'Total loan amount across all active loans',
    example: '50000000',
  })
  totalLoanAmount!: string;

  @ApiProperty({
    description: 'Total amount paid towards all loans',
    example: '12500000',
  })
  totalLoanPaid!: string;

  @ApiProperty({
    description: 'Total outstanding balance across all loans',
    example: '37500000',
  })
  totalLoanOutstanding!: string;

  @ApiProperty({
    description: 'Overall loan payment percentage (0-100)',
    example: 25.0,
  })
  loanPaymentPercentage!: number;
}
