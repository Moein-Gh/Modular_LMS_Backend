import { InstallmentStatus } from '@app/domain';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateInstallmentDto {
  @IsOptional()
  @IsEnum(InstallmentStatus)
  status?: InstallmentStatus;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsUUID()
  journalEntryId?: string;
}
