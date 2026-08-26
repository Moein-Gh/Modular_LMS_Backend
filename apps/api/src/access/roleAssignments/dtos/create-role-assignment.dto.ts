import { IsDate, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleAssignmentDto {
  @IsString()
  @Length(2, 64)
  userId: string;

  @IsString()
  @Length(2, 128)
  roleId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  @Length(2, 64)
  assignedBy?: string;
}
