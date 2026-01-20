import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { IsMutuallyExclusiveWith } from '@app/application/common/validators/is-mutually-exclusive-with.validator';
import { LoanRequestStatus } from '@app/domain';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetLoanRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  @IsMutuallyExclusiveWith('userId', {
    message: 'accountId and userId cannot be provided at the same time',
  })
  accountId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(LoanRequestStatus)
  status?: LoanRequestStatus | undefined;
}
