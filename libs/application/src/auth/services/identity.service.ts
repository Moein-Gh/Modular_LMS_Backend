import { CreateIdentityInput, DomainIdentity } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@generated/prisma';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  public async createIdentity(
    input: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity> {
    const prisma = tx ?? this.prisma;
    const identity = await prisma.identity.create({
      data: input,
    });
    return identity;
  }

  public async findByPhone(
    phone: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity | null> {
    const prisma = tx ?? this.prisma;
    const identity = await prisma.identity.findUnique({
      where: { phone },
    });
    if (!identity) {
      return null;
    }
    return identity;
  }
}
