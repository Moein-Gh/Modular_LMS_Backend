import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsBoolean()
  isActive: boolean;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  countryCode: string;

  @IsString()
  @IsOptional()
  nationalCode: string;

  @IsString()
  @IsOptional()
  email: string;
}
