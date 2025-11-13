import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetAccountsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string | undefined;

  @IsOptional()
  @IsString()
  accountTypeId?: string | undefined;
}
