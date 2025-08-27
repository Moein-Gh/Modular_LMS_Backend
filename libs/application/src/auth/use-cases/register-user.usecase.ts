import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { IdentityService } from '../services/identity.service';
import { UsersService } from '../../user/services/users.service';
import {
  RegisterUserInput,
  RegisterUserResult,
} from '../dtos/register-user.usecase.dto';
import { IdentityAlreadyExistsError } from '../errors/identityAlreadyExists';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identityService: IdentityService,
    private readonly usersService: UsersService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    return this.prisma.$transaction(async (tx) => {
      const conditions: Array<object> = [
        { phone: input.phone, countryCode: input.countryCode },
        { nationalCode: input.nationalCode },
      ];

      if (input.email) {
        conditions.push({ email: input.email });
      }

      let identity = await this.identityService.findOne(
        {
          OR: conditions,
        },
        tx,
      );
      if (identity) {
        throw new IdentityAlreadyExistsError();
      }
      identity = await this.identityService.createIdentity(input, tx);

      let user = await this.usersService.findByIdentityId(identity.id, tx);
      if (!user) {
        user = await this.usersService.create({ identityId: identity.id }, tx);
      }

      return {
        user: {
          ...user,
          identity,
        },
      };
    });
  }
}
