import { ListRoleAssignmentsParams, OrderDirection } from '@app/domain';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRoleAssignmentQueryDto implements ListRoleAssignmentsParams {
  @IsOptional()
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  take?: number;

  @IsOptional()
  @IsIn([OrderDirection.ASC, OrderDirection.DESC])
  orderDir?: OrderDirection;

  @IsOptional()
  @Type(() => String)
  search?: string;

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
