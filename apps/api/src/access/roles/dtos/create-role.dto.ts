import { IsString, IsOptional, Length } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @Length(2, 32)
  key: string;

  @IsString()
  @Length(2, 64)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 256)
  description?: string;
}
