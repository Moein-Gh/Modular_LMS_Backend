import { RoleAssignmentsService, RolesService } from '@app/application/access';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../user/services/users.service';
import {
  RegisterUserInput,
  RegisterUserResult,
} from '../dtos/register-user.usecase.dto';
import { IdentityAlreadyExistsError } from '../errors/identityAlreadyExists';
import { IdentitiesService } from '../services/identities.service';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly identityService: IdentitiesService,
    private readonly usersService: UsersService,
    private readonly transactionalRepository: PrismaTransactionalRepository,
    private readonly rolesService: RolesService,
    private readonly roleAssignmentsService: RoleAssignmentsService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    return this.transactionalRepository.withTransaction(async (tx) => {
      const conditions: Array<object> = [
        { phone: input.phone, countryCode: input.countryCode },
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
      // Assign roles
      await this.CreateRoleAssignments(input.roles, user.id, tx);
      return {
        user: {
          ...user,
          identity,
        },
      };
    });
  }

  async CreateRoleAssignments(
    roles: string[],
    userId: string,
    tx: Prisma.TransactionClient,
  ) {
    // check if roles exist
    for (const role of roles) {
      const roleEntity = await this.rolesService.getById(role, tx);
      if (!roleEntity) {
        throw new Error(`نقشی با شناسه ${role} وجود ندارد`);
      }
      await this.roleAssignmentsService.create(
        {
          roleId: roleEntity.id,
          userId,
        },
        tx,
      );
    }
  }
}
