import { Inject, Injectable } from '@nestjs/common';
import { DomainUser, USER_REPOSITORY, type IUserRepository } from '@app/domain';
import { CreateUserInput } from '../dtos/create-user.dto';
import { Prisma } from '@generated/prisma';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async create(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser> {
    const created = await this.users.createUser(input, tx);
    return created;
  }

  async findByIdentityId(
    identityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null> {
    const user = await this.users.findByIdentityId(identityId, tx);
    return user;
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null> {
    const user = await this.users.findById(id, tx);
    return user;
  }
  async setActive(
    userId: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.users.setActive(userId, isActive, tx);
  }

  async deleteUser(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.users.deleteUser(id, tx);
  }

  async findAll(tx?: Prisma.TransactionClient): Promise<DomainUser[]> {
    const users = await this.users.findAll(tx);
    return users;
  }
}
