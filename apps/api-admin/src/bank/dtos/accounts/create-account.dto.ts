import { IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  accountTypeId!: string;

  @IsString()
  name!: string;

  @IsString()
  userId!: string;

  @IsString()
  cardNumber!: string;

  @IsString()
  bankName!: string;
}
