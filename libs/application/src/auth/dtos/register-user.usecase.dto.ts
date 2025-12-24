import { Identity, User } from '@app/domain';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterUserInput {
  @IsString()
  @Length(8, 15)
  @Matches(/^\d+$/, { message: 'Phone must contain only digits' })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email: string | null;

  @IsString()
  @Length(2, 50)
  name: string;

  @IsString()
  @Length(1, 5)
  countryCode: string;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  roles: string[];
}

export type RegisterUserResult = {
  user: User & { identity: Identity };
};
