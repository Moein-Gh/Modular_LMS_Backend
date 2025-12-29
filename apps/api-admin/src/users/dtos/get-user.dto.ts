import { Identity, UserBalanceSummary, UserStatus } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetUserDto {
  @IsString()
  id: string;

  @IsNumber()
  @Type(() => Number)
  code: number;

  @IsEnum(UserStatus)
  status: UserStatus;

  @IsString()
  identityId: string;

  @IsOptional()
  @IsObject()
  identity?: Partial<Identity>;

  @IsOptional()
  @IsObject()
  balanceSummary?: UserBalanceSummary;
}
