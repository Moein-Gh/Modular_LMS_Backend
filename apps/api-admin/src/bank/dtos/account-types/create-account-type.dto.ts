import { IsString } from 'class-validator';

export class CreateAccountTypeDto {
  @IsString()
  name!: string;
}
