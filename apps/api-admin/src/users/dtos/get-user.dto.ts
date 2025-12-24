import { Identity, UserBalanceSummary } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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

  @IsBoolean()
  @Type(() => Boolean)
  isActive: boolean;

  @IsString()
  identityId: string;

  @IsOptional()
  @IsObject()
  identity?: Partial<Identity>;

  @IsOptional()
  @IsObject()
  balanceSummary?: UserBalanceSummary;
}
