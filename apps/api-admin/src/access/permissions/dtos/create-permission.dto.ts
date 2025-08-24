import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @Length(2, 64)
  key: string;

  @IsString()
  @Length(2, 128)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 512)
  description?: string;
}
