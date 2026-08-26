import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { AccountStatus } from '@app/domain';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetAccountsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(AccountStatus)
  status?: AccountStatus | undefined;

  @IsOptional()
  @IsString()
  accountTypeId?: string | undefined;
}
