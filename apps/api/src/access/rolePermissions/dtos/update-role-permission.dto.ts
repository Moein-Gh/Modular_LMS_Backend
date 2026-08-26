import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRolePermissionDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  permissionId?: string;
}
