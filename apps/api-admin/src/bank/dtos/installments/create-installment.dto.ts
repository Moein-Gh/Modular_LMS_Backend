import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { InstallmentStatus } from '@app/domain';

export class CreateInstallmentDto {
  @ApiProperty()
  @IsString()
  loanId!: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  installmentNumber!: number;

  @ApiProperty()
  @IsDateString()
  dueDate!: Date;

  @ApiProperty({ description: 'Decimal as string' })
  @IsString()
  amount!: string;

  @ApiProperty({ required: false, enum: InstallmentStatus })
  @IsOptional()
  @IsEnum(InstallmentStatus)
  status?: InstallmentStatus;
}
