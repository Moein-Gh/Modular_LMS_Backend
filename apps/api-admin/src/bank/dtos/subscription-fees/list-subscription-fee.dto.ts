import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { SubscriptionFeeStatus } from '@app/domain';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetSubscriptionFeesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsEnum(SubscriptionFeeStatus)
  status?: SubscriptionFeeStatus | undefined;

  @IsEnum(['periodStart', 'createdAt', 'amount'])
  @IsOptional()
  declare orderBy?: string;
}
