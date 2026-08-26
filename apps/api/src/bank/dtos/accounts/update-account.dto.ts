import { AccountStatus } from '@app/domain';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  accountTypeId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @Length(16)
  cardNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
