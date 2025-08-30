import { Inject, Injectable } from '@nestjs/common';

import { USER_REPOSITORY, type IUserRepository } from '@app/domain';
import type { CreateUserResult } from '../types/create-user.type';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(): Promise<CreateUserResult> {
    const created = await this.users.createUser();
    return { id: created.id, isActive: created.isActive };
  }
}
