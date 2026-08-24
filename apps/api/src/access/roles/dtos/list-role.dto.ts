import { ListRolesParams, OrderDirection } from '@app/domain';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';

export class ListRolesQuery implements ListRolesParams {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsIn(['createdAt', 'name', 'key'])
  orderBy?: 'createdAt' | 'name' | 'key';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: OrderDirection;
}
