import { NotFoundError } from '@app/application/errors/not-found.error';
import {
  RECIPIENT_GROUP_REPOSITORY,
  RecipientGroup,
  type CreateRecipientGroupInput,
  type UpdateRecipientGroupInput,
} from '@app/domain';
import { PrismaRecipientGroupRepository } from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RecipientGroupService {
  constructor(
    @Inject(RECIPIENT_GROUP_REPOSITORY)
    private readonly groupRepo: PrismaRecipientGroupRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async create(
    input: CreateRecipientGroupInput,
    currentUserId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    const data = {
      ...input,
      createdBy: currentUserId,
    };

    if (tx) {
      return this.groupRepo.create(data, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.create(input, currentUserId, t),
    );
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    if (tx) {
      const group = await this.groupRepo.findById(id, tx);
      if (!group) {
        throw new NotFoundError('RecipientGroup', 'id', id);
      }
      return group;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findById(id, t),
    );
  }

  async findByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup | null> {
    if (tx) {
      return this.groupRepo.findByName(name, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findByName(name, t),
    );
  }

  async findAll(
    options?: Prisma.RecipientGroupFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup[]> {
    if (tx) {
      return this.groupRepo.findAll(options, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findAll(options, t),
    );
  }

  async update(
    id: string,
    input: UpdateRecipientGroupInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    if (tx) {
      return this.groupRepo.update(id, input, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.update(id, input, t),
    );
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    if (tx) {
      await this.groupRepo.softDelete(id, tx);
      return;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.softDelete(id, t),
    );
  }

  async restore(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RecipientGroup> {
    if (tx) {
      return this.groupRepo.restore(id, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.restore(id, t),
    );
  }

  async count(
    where?: Prisma.RecipientGroupWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    if (tx) {
      return this.groupRepo.count(where, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.count(where, t),
    );
  }
}
