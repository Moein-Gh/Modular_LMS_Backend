import { RecipientStatus } from '@app/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRecipientStatusDto {
  @ApiProperty({ enum: RecipientStatus })
  @IsEnum(RecipientStatus)
  @IsNotEmpty()
  status!: RecipientStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  errorMessage?: string;
}
