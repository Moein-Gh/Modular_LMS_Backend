import { IsString, IsOptional, Length } from 'class-validator';

export class RequestSmsCodeDto {
  @IsString()
  @Length(5, 20)
  phone!: string;

  @IsString()
  purpose!: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}
