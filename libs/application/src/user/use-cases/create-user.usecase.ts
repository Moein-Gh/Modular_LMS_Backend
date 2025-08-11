import { Inject, Injectable } from '@nestjs/common';
import { Email, USER_REPOSITORY, type IUserRepository } from '@app/domain';
import type {
  CreateUserCommand,
  CreateUserResult,
} from '../dtos/create-user.dto';
import { UserAlreadyExistsError } from '../errors/user-already-exists.error';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(cmd: CreateUserCommand): Promise<CreateUserResult> {
    const email = Email.create(cmd.email).toString();

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsError(email);
    }

    const created = await this.users.createUser({ email });
    return { id: created.id, email: created.email, isActive: created.isActive };
  }
}
