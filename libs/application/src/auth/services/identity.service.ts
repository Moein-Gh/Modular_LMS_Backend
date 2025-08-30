import {
  CreateIdentityInput,
  DomainIdentity,
  IdentityRepository,
  IDENTITY_REPOSITORY,
} from '@app/domain';
import { Injectable, Inject } from '@nestjs/common';
import type { Prisma } from '@generated/prisma';

@Injectable()
export class IdentityService {
  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
  ) {}

  public async createIdentity(
    input: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity> {
    const identity = await this.identityRepository.create(input, tx);
    return identity;
  }

  public async findByPhone(
    phone: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity | null> {
    const identity = await this.identityRepository.findOne({ phone }, tx);
    return identity ?? null;
  }

  public async findOne(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity | null> {
    const identity = await this.identityRepository.findOne(where, tx);
    return identity ?? null;
  }

  public async update(
    id: string,
    data: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainIdentity> {
    const identity = await this.identityRepository.update(id, data, tx);
    return identity;
  }
}
