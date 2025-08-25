import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export class ListRoleAssignmentQueryDto extends BaseListQueryDto {
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsOptional()
  @IsIn(['createdAt', 'expiresAt', 'assignedBy'])
  declare orderBy?: 'createdAt' | 'expiresAt' | 'assignedBy';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeUser?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRole?: boolean;
}
