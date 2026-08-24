import {
  IsDecimal,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTransferTransactionDto {
  @IsUUID('4', { message: 'sourceAccountId must be a valid ID' })
  sourceAccountId: string;

  @IsUUID('4', { message: 'destinationAccountId must be a valid ID' })
  destinationAccountId: string;

  @IsDecimal(
    { decimal_digits: '0,4' },
    { message: 'amount must be a valid decimal' },
  )
  amount: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
