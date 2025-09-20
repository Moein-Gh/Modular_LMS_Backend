import { IsNumber, IsString } from 'class-validator';

export class UpdateAccountTypeDto {
  @IsString()
  name!: string;

  @IsNumber()
  maxAccounts!: number | null;
}
