import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class GetRoleAssignmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  includeUser?: boolean;

  @IsOptional()
  @IsBoolean()
  includeRole?: boolean;
}
