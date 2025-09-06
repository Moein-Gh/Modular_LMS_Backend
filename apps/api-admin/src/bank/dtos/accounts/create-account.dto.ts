import { IsString, Matches, MinLength, IsUUID } from 'class-validator';

export class CreateAccountDto {
  @IsUUID('4', { message: 'accountTypeId must be a valid ID' })
  accountTypeId: string;

  @IsUUID('4', { message: 'userId must be a valid ID' })
  userId: string;

  @IsString()
  @Matches(/^\d{16}$/, { message: 'cardNumber must be exactly 16 digits' })
  cardNumber: string;

  @IsString()
  @MinLength(3)
  bankName: string;
}
