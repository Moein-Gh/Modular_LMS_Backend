import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, type IUserRepository } from '@app/domain';
import type { CreateUserResult } from '../dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async create(): Promise<CreateUserResult> {
    const created = await this.users.createUser();
    return { id: created.id, isActive: created.isActive };
  }
}
