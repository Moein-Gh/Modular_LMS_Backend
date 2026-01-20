import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddToQueueDto {
  @ApiProperty({ description: 'Loan request ID to add to queue' })
  @IsUUID()
  @IsNotEmpty()
  loanRequestId: string;

  @ApiProperty({ description: 'Queue order position', example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  queueOrder: number;

  @ApiPropertyOptional({ description: 'Admin notes for this queue item' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
