import { DomainIdentity, DomainUser } from '@app/domain';
import {
  IsOptional,
  IsString,
  IsEmail,
  Length,
  Matches,
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

  @IsString()
  @Length(3, 20)
  nationalCode: string;
}

export type RegisterUserResult = {
  user: DomainUser & { identity: DomainIdentity };
};
