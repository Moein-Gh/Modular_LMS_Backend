import { ApiProperty } from '@nestjs/swagger';

class UserIdentityDto {
  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User phone number' })
  phone: string;
}

class UserDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'User code' })
  code: number;

  @ApiProperty({ description: 'User identity information' })
  identity: UserIdentityDto;
}

class LoanDto {
  @ApiProperty({ description: 'Loan UUID' })
  id: string;

  @ApiProperty({ description: 'Loan code' })
  code: number;

  @ApiProperty({ description: 'Loan name' })
  name: string;

  @ApiProperty({ description: 'Loan principal amount', example: '10000000' })
  amount: string;

  @ApiProperty({
    description: 'Loan status',
    enum: ['PENDING', 'ACTIVE', 'PAID'],
  })
  status: string;

  @ApiProperty({ description: 'User who owns the loan' })
  user: UserDto;
}

class InstallmentDetailDto {
  @ApiProperty({ description: 'Installment UUID' })
  id: string;

  @ApiProperty({ description: 'Installment code' })
  code: number;

  @ApiProperty({ description: 'Installment number', example: 1 })
  installmentNumber: number;

  @ApiProperty({ description: 'Installment amount', example: '500000' })
  amount: string;

  @ApiProperty({ description: 'Due date', example: '2026-01-25T00:00:00.000Z' })
  dueDate: Date;

  @ApiProperty({
    description: 'Installment status',
    enum: ['PENDING', 'ACTIVE', 'PAID', 'ALLOCATED'],
  })
  status: string;

  @ApiProperty({ description: 'Payment date', required: false })
  paymentDate?: Date;

  @ApiProperty({ description: 'Loan details' })
  loan: LoanDto;
}

class InstallmentGroupDto {
  @ApiProperty({ description: 'Number of installments' })
  count: number;

  @ApiProperty({ description: 'Total amount', example: '50000000' })
  totalAmount: string;

  @ApiProperty({
    description: 'List of installments',
    type: [InstallmentDetailDto],
  })
  installments: InstallmentDetailDto[];
}

class MonthlyInstallmentProjectionDto {
  @ApiProperty({ description: 'Expected installments for the month' })
  expected: InstallmentGroupDto;

  @ApiProperty({ description: 'Paid installments' })
  paid: InstallmentGroupDto;

  @ApiProperty({ description: 'Pending installments' })
  pending: InstallmentGroupDto;
}

export class InstallmentProjectionsResponseDto {
  @ApiProperty({ description: 'Current month projections' })
  currentMonth: MonthlyInstallmentProjectionDto;

  @ApiProperty({ description: 'Next month projections' })
  nextMonth: InstallmentGroupDto;

  @ApiProperty({ description: 'Next 3 months projections' })
  next3Months: InstallmentGroupDto;
}
