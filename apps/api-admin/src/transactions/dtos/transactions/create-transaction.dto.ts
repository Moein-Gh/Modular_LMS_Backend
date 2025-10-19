import {
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum TransactionKindDto {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  FEE = 'FEE',
}

export enum TransactionStatusDto {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateTransactionDto {
  @IsUUID('4', { message: 'userId must be a valid ID' })
  userId: string;

  @IsEnum(TransactionKindDto, {
    message: 'kind must be a valid transaction kind',
  })
  kind: TransactionKindDto;

  @IsDecimal(
    { decimal_digits: '0,4' },
    { message: 'amount must be a valid decimal' },
  )
  amount: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
