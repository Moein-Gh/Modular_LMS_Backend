import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBankDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  subscriptionFee!: string;

  @IsString()
  commissionPercentage!: string;

  @IsOptional()
  @IsUUID('4')
  accountId?: string;
}
