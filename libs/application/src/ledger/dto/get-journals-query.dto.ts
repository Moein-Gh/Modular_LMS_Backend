import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetJournalsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Include journal entries in the response',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  includeEntries?: boolean;
}
