import { Injectable } from '@nestjs/common';
import { IdentityService } from '../services/identity.service';
import { UsersService } from '../../user/services/users.service';
import {
  RegisterUserInput,
  RegisterUserResult,
} from '../dtos/register-user.usecase.dto';
import { IdentityAlreadyExistsError } from '../errors/identityAlreadyExists';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly identityService: IdentityService,
    private readonly usersService: UsersService,
    private readonly transactionalRepository: PrismaTransactionalRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    return this.transactionalRepository.withTransaction(async (tx) => {
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
