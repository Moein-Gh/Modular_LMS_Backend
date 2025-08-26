import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository, DomainUser } from '@app/domain';
import { PrismaService } from '../../prisma/prisma.module';
import type { Prisma } from '@generated/prisma';
import { CreateUserInput } from '@app/application';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: Prisma.TransactionClient,
  ) {}

  public async createUser(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser> {
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
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findUnique({ where: { id } });
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
    tx?: Prisma.TransactionClient,
  ): Promise<DomainUser | null> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findFirst({
      where: { identityId },
    });
    return user;
  }
}
