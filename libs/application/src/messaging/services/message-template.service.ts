import { NotFoundError } from '@app/application/errors/not-found.error';
import {
  MESSAGE_TEMPLATE_REPOSITORY,
  MessageTemplate,
  type CreateMessageTemplateInput,
  type UpdateMessageTemplateInput,
} from '@app/domain';
import { PrismaMessageTemplateRepository } from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MessageTemplateService {
  constructor(
    @Inject(MESSAGE_TEMPLATE_REPOSITORY)
    private readonly templateRepo: PrismaMessageTemplateRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async create(
    input: CreateMessageTemplateInput,
    currentUserId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    const data = {
      ...input,
      createdBy: currentUserId,
    };

    if (tx) {
      return this.templateRepo.create(data, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.create(input, currentUserId, t),
    );
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    if (tx) {
      const template = await this.templateRepo.findById(id, tx);
      if (!template) {
        throw new NotFoundError('MessageTemplate', 'id', id);
      }
      return template;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findById(id, t),
    );
  }

  async findByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate | null> {
    if (tx) {
      return this.templateRepo.findByName(name, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findByName(name, t),
    );
  }

  async findAll(
    options?: Prisma.MessageTemplateFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate[]> {
    if (tx) {
      return this.templateRepo.findAll(options, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findAll(options, t),
    );
  }

  async update(
    id: string,
    input: UpdateMessageTemplateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    if (tx) {
      return this.templateRepo.update(id, input, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.update(id, input, t),
    );
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    if (tx) {
      await this.templateRepo.softDelete(id, tx);
      return;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.softDelete(id, t),
    );
  }

  async restore(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    if (tx) {
      return this.templateRepo.restore(id, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.restore(id, t),
    );
  }

  async count(
    where?: Prisma.MessageTemplateWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    if (tx) {
      return this.templateRepo.count(where, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.count(where, t),
    );
  }
}
