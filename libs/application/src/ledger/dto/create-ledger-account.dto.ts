import { LedgerAccountStatus, LedgerAccountType } from '@app/domain';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateLedgerAccountDto {
  @IsString()
  @Length(1, 32)
  code!: string;

  @IsString()
  @Length(1, 255)
  name!: string;

  @IsEnum(LedgerAccountType)
  type!: LedgerAccountType;

  @IsOptional()
  @IsEnum(LedgerAccountStatus)
  status?: LedgerAccountStatus;
}
