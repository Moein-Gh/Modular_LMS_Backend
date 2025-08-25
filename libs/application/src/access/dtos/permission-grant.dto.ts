import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreatePermissionGrantDto {
  @ApiProperty({ enum: ['user', 'role'] })
  granteeType: 'user' | 'role';

  @ApiProperty()
  granteeId: string;

  @ApiProperty()
  permissionId: string;

  @ApiProperty({ required: false })
  grantedBy?: string;

  @ApiProperty({ required: false, default: true })
  isGranted?: boolean = true;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  expiresAt?: Date;
}

export class UpdatePermissionGrantDto extends PartialType(
  CreatePermissionGrantDto,
) {}
