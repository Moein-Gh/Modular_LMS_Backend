import { IsString } from 'class-validator';

export class UpdateAccountTypeDto {
  @IsString()
  name!: string;
}
