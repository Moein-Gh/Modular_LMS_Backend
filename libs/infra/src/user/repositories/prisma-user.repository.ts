import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository, User } from '@app/domain';
import type { Prisma } from '@generated/prisma';
import { CreateUserInput } from '@app/application';
import { PrismaService } from '@app/infra/prisma/prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: Prisma.TransactionClient,
  ) {}

  public async createUser(
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
    include: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<User[]> {
    const prisma = tx ?? this.prisma;
    const users = await prisma.user.findMany({
      include: { identity: include },
    });
    return users;
  }

  public async deleteUser(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.user.delete({ where: { id } });
  }
}
