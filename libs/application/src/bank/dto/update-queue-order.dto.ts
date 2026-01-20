import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateQueueOrderDto {
  @ApiProperty({ description: 'New queue order position', example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  newOrder: number;
}
