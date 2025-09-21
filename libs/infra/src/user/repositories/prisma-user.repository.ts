import { CreateUserInput, UpdateUserInput } from '@app/application';
import type { IUserRepository, User } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: Prisma.TransactionClient,
  ) {}
  public async count(
    where?: Prisma.UserWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.user.count({ where: where });
  }

  public async update(
    id: string,
    input: UpdateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;

    const updated = await prisma.user.update({
      where: { id },
      data: input,
    });
    return updated;
  }

  public async create(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;

    const user = await prisma.user.create({
      data: {
        identityId: input.identityId,
        isActive: true,
      },
    });
    return user;
  }

  public async findById(
    id: string,
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { identity: include },
    });
    if (!user) return null;
    return user;
  }

  public async setActive(
    userId: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  public async findByIdentityId(
    identityId: string,
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findUnique({
      where: { identityId },
      include: { identity: include },
    });
    return user;
  }

  public async findAll(
    options: Prisma.UserFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<User[]> {
    const prisma = tx ?? this.prisma;
    const users = await prisma.user.findMany(options);
    return users;
  }

  public async delete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.user.delete({ where: { id } });
  }
}
