import { IsEmail, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(100)
  email!: string;
}
