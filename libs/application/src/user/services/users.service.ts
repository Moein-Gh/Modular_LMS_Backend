import { Inject, Injectable } from '@nestjs/common';
import { User, USER_REPOSITORY, type IUserRepository } from '@app/domain';
import { CreateUserInput } from '../types/create-user.type';
import { Prisma } from '@generated/prisma';
import { UpdateUserInput } from '../types/update-user.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async create(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const created = await this.users.createUser(input, tx);
    return created;
  }

  async findByIdentityId(
    identityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const user = await this.users.findByIdentityId(identityId, true, tx);
    return user;
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const user = await this.users.findById(id, true, tx);
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

  async findAll(
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User[]> {
    const users = await this.users.findAll(include, tx);
    return users;
  }
  async updateUser(
    id: string,
    update: UpdateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    await this.users.setActive(id, update.isActive, tx);
    return this.findById(id, tx);
  }
}
