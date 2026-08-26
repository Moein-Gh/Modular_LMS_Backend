import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { IsMutuallyExclusiveWith } from '@app/application/common/validators/is-mutually-exclusive-with.validator';
import { LoanStatus } from '@app/domain';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetLoansQueryDto extends PaginationQueryDto {
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
  @IsUUID()
  loanTypeId?: string;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus | undefined;
}
