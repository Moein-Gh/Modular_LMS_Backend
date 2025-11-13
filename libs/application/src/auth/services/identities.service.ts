import { NotFoundError } from '@app/application/errors/not-found.error';
import { Identity, IDENTITY_REPOSITORY } from '@app/domain';
import {
  CreateIdentityInput,
  UpdateIdentityInput,
} from '@app/domain/auth/types/identity.type';
import { PrismaIdentityRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class IdentitiesService {
  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: PrismaIdentityRepository,
  ) {}

  public async createIdentity(
    input: CreateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity> {
    return this.identityRepository.create(input, tx);
  }

  public async findAll(
    options?: Prisma.IdentityFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity[]> {
    return this.identityRepository.findAll(options, tx);
  }

  public async findOne(
    where?: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity | null> {
    const results = await this.identityRepository.findAll({ where }, tx);
    return results.length ? results[0] : null;
  }

  public async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity> {
    const identity = await this.identityRepository.findById(id, tx);
    if (!identity) {
      throw new NotFoundError('Identity', 'id', id);
    }
    return identity;
  }

  public async count(
    where: Prisma.IdentityWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.identityRepository.count(where, tx);
  }

  public async delete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const existing = await this.identityRepository.findById(id, tx);
    if (!existing) {
      throw new NotFoundError('Identity', 'id', id);
    }
    try {
      return await this.identityRepository.delete(id, tx);
    } catch (e) {
      if ((e as { code?: unknown })?.code === 'P2025') {
        throw new NotFoundError('Identity', 'id', id);
      }
      throw e;
    }
  }

  public async update(
    id: string,
    data: UpdateIdentityInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Identity> {
    const existing = await this.identityRepository.findById(id, tx);
    if (!existing) {
      throw new NotFoundError('Identity', 'id', id);
    }
    try {
      return await this.identityRepository.update(id, data, tx);
    } catch (e) {
      if ((e as { code?: unknown })?.code === 'P2025') {
        throw new NotFoundError('Identity', 'id', id);
      }
      throw e;
    }
  }
}
