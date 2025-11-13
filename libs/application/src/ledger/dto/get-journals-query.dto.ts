import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class GetJournalsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  includeEntries?: boolean;

  @IsUUID()
  @IsOptional()
  transactionId?: string;
}
