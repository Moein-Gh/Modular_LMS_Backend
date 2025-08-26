import { IsString, Length } from 'class-validator';

export class VerifySmsCodeDto {
  @IsString()
  @Length(5, 20)
  phone!: string;

  @IsString()
  @Length(4, 10)
  code!: string;

  @IsString()
  purpose!: string;
}
