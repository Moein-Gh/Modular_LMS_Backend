import { ApiProperty } from '@nestjs/swagger';

class MetricDto {
  @ApiProperty({ example: '12345.0000' })
  lastMonth: string;

  @ApiProperty({ example: '12345.0000' })
  monthlyAverage: string;

  @ApiProperty({ example: '12345.0000' })
  today: string;
}

export class BankFinancialSummaryDto {
  @ApiProperty({
    description: 'Total cash on hand (derived: deposits - loans)',
    type: MetricDto,
  })
  cashOnHand: MetricDto;

  @ApiProperty({
    description:
      'Total customer deposits (Balance of Customer Deposits account - 2000)',
    type: MetricDto,
  })
  customerDeposits: MetricDto;

  @ApiProperty({
    description:
      'Total outstanding loans (Balance of Loans Receivable account - 1100)',
    type: MetricDto,
  })
  loansReceivable: MetricDto;

  @ApiProperty({
    description:
      'Total income earned (Balance of Fee/Commission Income account - 4100)',
    type: MetricDto,
  })
  totalIncomeEarned: MetricDto;

  @ApiProperty({
    description: 'Date and time when this summary was calculated',
    example: '2025-10-23T12:00:00.000Z',
  })
  asOfDate: Date;
}
