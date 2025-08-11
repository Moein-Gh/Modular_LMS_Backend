import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository, DomainUser } from '@app/domain';
import { PrismaService } from '../../prisma/prisma.module';
import type { PrismaClient } from '@generated/prisma';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  public async createUser(params: { email: string }): Promise<DomainUser> {
    const prisma = this.prisma;
    const user = await prisma.user.create({
      data: { email: params.email },
    });
    return { id: user.id, email: user.email, isActive: user.isActive };
  }

  public async findByEmail(email: string): Promise<DomainUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, isActive: user.isActive };
  }

  public async findById(id: string): Promise<DomainUser | null> {
    const prisma = this.prisma;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { id: user.id, email: user.email, isActive: user.isActive };
  }

  public async setActive(userId: string, isActive: boolean): Promise<void> {
    const prisma = this.prisma;
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }
}
