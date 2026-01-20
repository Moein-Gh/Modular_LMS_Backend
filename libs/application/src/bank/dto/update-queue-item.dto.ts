import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateQueueItemDto {
  @ApiPropertyOptional({ description: 'Admin notes for this queue item' })
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
