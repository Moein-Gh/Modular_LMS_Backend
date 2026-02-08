import { IsString, IsUUID } from 'class-validator';

export class CreateRolePermissionDto {
  @IsString()
  @IsUUID()
  roleId!: string;

  @IsString()
  @IsUUID()
  permissionId!: string;
}
