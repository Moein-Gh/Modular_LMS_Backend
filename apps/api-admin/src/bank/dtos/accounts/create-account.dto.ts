import { Type } from 'class-transformer';
import { IsDate, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsUUID('4', { message: 'accountTypeId must be a valid ID' })
  accountTypeId: string;

  @IsUUID('4', { message: 'userId must be a valid ID' })
  userId: string;

  @IsString()
  @Matches(/^\d{8}$/, { message: 'cardNumber must be exactly 8 digits' })
  cardNumber: string;

  @IsString()
  @MinLength(3)
  bankName: string;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;
}
