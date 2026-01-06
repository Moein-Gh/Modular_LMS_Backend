import type {
  CreateMessageTemplateInput,
  IMessageTemplateRepository,
  MessageTemplate,
  MessageType,
  UpdateMessageTemplateInput,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma, type PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaMessageTemplateRepository
  implements IMessageTemplateRepository
{
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClient,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async count(
    where?: Prisma.MessageTemplateWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.messageTemplate.count({
      where: { isDeleted: false, ...where },
    });
  }

  async findAll(
    options?: Prisma.MessageTemplateFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate[]> {
    const prisma = tx ?? this.prisma;
    const templates = await prisma.messageTemplate.findMany({
      ...options,
      where: { isDeleted: false, ...options?.where },
    });
    return templates.map((t) => this.toDomain(t));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate | null> {
    const prisma = tx ?? this.prisma;
    const template = await prisma.messageTemplate.findUnique({
      where: { isDeleted: false, id },
    });
    if (!template) return null;
    return this.toDomain(template);
  }

  async findByName(
    name: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate | null> {
    const prisma = tx ?? this.prisma;
    const template = await prisma.messageTemplate.findUnique({
      where: { isDeleted: false, name },
    });
    if (!template) return null;
    return this.toDomain(template);
  }

  async create(
    data: CreateMessageTemplateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    const prisma = tx ?? this.prisma;
    const template = await prisma.messageTemplate.create({
      data: {
        name: data.name,
        type: data.type as MessageType,
        subject: data.subject,
        content: data.content,
        variables: data.variables,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      },
    });
    return this.toDomain(template);
  }

  async update(
    id: string,
    data: UpdateMessageTemplateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    const prisma = tx ?? this.prisma;
    const template = await prisma.messageTemplate.update({
      where: { isDeleted: false, id },
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        variables: data.variables,
        isActive: data.isActive,
      },
    });
    return this.toDomain(template);
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.messageTemplate.update({
      where: { isDeleted: false, id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restore(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageTemplate> {
    const prisma = tx ?? this.prisma;
    const template = await prisma.messageTemplate.update({
      where: { isDeleted: true, id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });
    return this.toDomain(template);
  }

  private toDomain(
    template: Prisma.MessageTemplateGetPayload<object>,
  ): MessageTemplate {
    return {
      id: template.id,
      code: template.code,
      name: template.name,
      type: template.type as MessageType,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      isDeleted: template.isDeleted,
      deletedAt: template.deletedAt,
      deletedBy: template.deletedBy,
    };
  }
}
