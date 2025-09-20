import { IsNumber, IsString } from 'class-validator';

export class CreateAccountTypeDto {
  @IsString()
  name!: string;

  @IsNumber()
  maxAccounts!: number | null;
}
