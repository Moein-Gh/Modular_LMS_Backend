import { UserStatus } from '@generated/prisma';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListUsersDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsOptional()
  @IsString()
  identityId?: string;
}
