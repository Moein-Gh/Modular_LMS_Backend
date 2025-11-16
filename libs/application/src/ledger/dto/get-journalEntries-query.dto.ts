import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class GetJournalEntriesQueryDto extends PaginationQueryDto {
  @IsUUID()
  @IsOptional()
  journalId?: string;
}
