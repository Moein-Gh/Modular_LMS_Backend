import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { TransactionKind, TransactionStatus } from '@app/domain';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetTransactionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus | undefined;

  @IsOptional()
  @IsString()
  @IsEnum(TransactionKind)
  kind?: TransactionKind | undefined;
}
