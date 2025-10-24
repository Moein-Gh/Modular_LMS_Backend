import { ApiProperty } from '@nestjs/swagger';

export class BankFinancialSummaryDto {
  @ApiProperty({
    description: 'Total cash on hand (Balance of Cash account - 1000)',
    example: '5000000.0000',
  })
  cashOnHand: string;

  @ApiProperty({
    description:
      'Total customer deposits (Balance of Customer Deposits account - 2000)',
    example: '3000000.0000',
  })
  customerDeposits: string;

  @ApiProperty({
    description:
      'Total outstanding loans (Balance of Loans Receivable account - 1100)',
    example: '2000000.0000',
  })
  loansReceivable: string;

  @ApiProperty({
    description: 'Cash available for new loans (cashOnHand - customerDeposits)',
    example: '2000000.0000',
  })
  availableForLending: string;

  @ApiProperty({
    description: 'Total assets (cashOnHand + loansReceivable)',
    example: '7000000.0000',
  })
  totalAssets: string;

  @ApiProperty({
    description: 'Total liabilities (customerDeposits)',
    example: '3000000.0000',
  })
  totalLiabilities: string;

  @ApiProperty({
    description: 'Net equity (totalAssets - totalLiabilities)',
    example: '4000000.0000',
  })
  netEquity: string;

  @ApiProperty({
    description:
      'Total income earned (Balance of Fee/Commission Income account - 4100)',
    example: '150000.0000',
  })
  totalIncomeEarned: string;

  @ApiProperty({
    description: 'Date and time when this summary was calculated',
    example: '2025-10-23T12:00:00.000Z',
  })
  asOfDate: Date;
}
