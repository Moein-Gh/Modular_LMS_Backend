import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetUpcomingPaymentsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  includePastPaid?: boolean = false;
}

export enum PaymentStatus {
  PAID = 'PAID',
  NOT_PAID = 'NOT_PAID',
}

export enum PaymentType {
  INSTALLMENT = 'INSTALLMENT',
  SUBSCRIPTION_FEE = 'SUBSCRIPTION_FEE',
}

export interface PaymentItemDto {
  id: string;
  type: PaymentType;
  amount: string;
  status: PaymentStatus;
  dueDate: Date;
  paymentDate?: Date;
  transactionId?: string;

  // For installments
  loanId?: string;
  loanName?: string;
  installmentNumber?: number;

  // For subscription fees
  accountId?: string;
  accountName?: string;
  periodStart?: Date;
}

export interface MonthlyPaymentDto {
  month: string; // e.g., "1402-12" (Persian year-month)
  monthName: string; // e.g., "Esfand 1402"
  year: number;
  monthNumber: number;
  lastDayOfMonth: Date;
  lastDayOfMonthPersian: string; // e.g., "1403/10/30" (Persian formatted)
  items: PaymentItemDto[];
  total: string;
  totalPaid: string;
  totalUnpaid: string;
}

export interface UpcomingPaymentsResponseDto {
  upcomingMonths: MonthlyPaymentDto[];
  pastMonths: MonthlyPaymentDto[];
  grandTotal: string;
  totalPaid: string;
  totalUnpaid: string;
}
