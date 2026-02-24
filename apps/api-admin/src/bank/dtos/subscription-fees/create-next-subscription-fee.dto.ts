import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateNextSubscriptionFeeDto {
  @ApiPropertyOptional({
    description:
      'Number of consecutive monthly fees to generate. Defaults to 1.',
    default: 1,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  numberOfMonths?: number = 1;
}
