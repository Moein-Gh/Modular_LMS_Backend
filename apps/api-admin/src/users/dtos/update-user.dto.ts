import { IsBoolean, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsBoolean()
  isActive: boolean;

  @IsString()
  identityId: string;
}
