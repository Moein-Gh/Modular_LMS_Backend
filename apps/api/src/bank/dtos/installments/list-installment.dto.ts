import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { InstallmentStatus } from '@app/domain';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class GetInstallmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  loanId?: string;

  @IsOptional()
  @IsEnum(InstallmentStatus)
  status?: InstallmentStatus | undefined;

  @IsEnum(['dueDate', 'createdAt', 'amount', 'installmentNumber'])
  @IsOptional()
  declare orderBy?: string;
}
