import { GrantType } from '@app/domain';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePermissionGrantDto {
  @IsEnum(GrantType)
  granteeType!: GrantType;

  @IsString()
  @IsUUID()
  granteeId!: string;

  @IsString()
  @IsUUID()
  permissionId!: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  grantedBy?: string;

  @IsBoolean()
  isGranted: boolean = true;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}

export class UpdatePermissionGrantDto {
  @IsOptional()
  @IsEnum(GrantType)
  granteeType?: GrantType;

  @IsOptional()
  @IsString()
  @IsUUID()
  granteeId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  permissionId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  grantedBy?: string;

  @IsOptional()
  @IsBoolean()
  isGranted?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
