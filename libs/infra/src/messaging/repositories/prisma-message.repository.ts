import type {
  CreateMessageInput,
  CreateMessageRecipientInput,
  IMessageRepository,
  Message,
  MessageRecipient,
  UpdateMessageInput,
  UpdateMessageRecipientInput,
} from '@app/domain';
import { MessageStatus, MessageType, RecipientStatus } from '@app/domain';

import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma, type PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const messageInclude = {
  template: true,
  recipients: {
    include: {
      user: {
        include: {
          identity: true,
        },
      },
    },
  },
} as const;

type RecipientWithUser =
  | Prisma.MessageRecipientGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            code: true;
            identityId: true;
            status: true;
          };
        };
      };
    }>
  | Prisma.MessageRecipientGetPayload<{
      include: {
        user: {
          include: {
            identity: true;
          };
        };
      };
    }>;

@Injectable()
export class PrismaMessageRepository implements IMessageRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClient,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async count(
    where?: Prisma.MessageWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.message.count({ where: { isDeleted: false, ...where } });
  }

  async findAll(
    options?: Prisma.MessageFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Message[]> {
    const prisma = tx ?? this.prisma;
    const messages = await prisma.message.findMany({
      ...options,
      where: { isDeleted: false, ...options?.where },
      include: messageInclude,
    });
    return messages.map((message) => this.toDomain(message));
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Message | null> {
    const prisma = tx ?? this.prisma;
    const message = await prisma.message.findUnique({
      where: { isDeleted: false, id },
      include: messageInclude,
    });
    if (!message) return null;
    return this.toDomain(message);
  }

  async findByIdWithRecipients(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Message | null> {
    const prisma = tx ?? this.prisma;
    const message = await prisma.message.findUnique({
      where: { isDeleted: false, id },
      include: {
        ...messageInclude,
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                code: true,
                identityId: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!message) return null;
    return this.toDomain(message);
  }

  async create(
    data: CreateMessageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Message> {
    const prisma = tx ?? this.prisma;
    const message = await prisma.message.create({
      data: {
        type: data.type as MessageType,
        status: data.status as MessageStatus,
        subject: data.subject,
        content: data.content,
        templateId: data.templateId,
        scheduledAt: data.scheduledAt,
        metadata: data.metadata as Prisma.InputJsonValue,
        createdBy: data.createdBy,
      },
      include: messageInclude,
    });
    return this.toDomain(message);
  }

  async update(
    id: string,
    data: UpdateMessageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Message> {
    const prisma = tx ?? this.prisma;
    const message = await prisma.message.update({
      where: { isDeleted: false, id },
      data: {
        status: data.status as MessageStatus | undefined,
        sentAt: data.sentAt,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
      include: messageInclude,
    });
    return this.toDomain(message);
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.message.update({
      where: { isDeleted: false, id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<Message> {
    const prisma = tx ?? this.prisma;
    const message = await prisma.message.update({
      where: { isDeleted: true, id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
      include: messageInclude,
    });
    return this.toDomain(message);
  }

  async markRecipientsAsRead(
    userId: string,
    messageIds: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.messageRecipient.updateMany({
      where: {
        userId,
        messageId: { in: messageIds },
        status: { not: RecipientStatus.READ },
        isDeleted: false,
      },
      data: {
        status: RecipientStatus.READ,
        readAt: new Date(),
      },
    });
  }

  // Recipient operations
  async createRecipient(
    data: CreateMessageRecipientInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageRecipient> {
    const prisma = tx ?? this.prisma;
    const recipient = await prisma.messageRecipient.create({
      data: {
        messageId: data.messageId,
        userId: data.userId,
        phone: data.phone,
        renderedContent: data.renderedContent as unknown as string | undefined,
        email: data.email,
        status: data.status as RecipientStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            code: true,
            identityId: true,
            status: true,
          },
        },
      },
    });
    return this.recipientToDomain(recipient);
  }

  async updateRecipient(
    id: string,
    data: UpdateMessageRecipientInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageRecipient> {
    const prisma = tx ?? this.prisma;
    const recipient = await prisma.messageRecipient.update({
      where: { isDeleted: false, id },
      data: {
        // keep renderedContent immutable via updateRecipient for now
        status: data.status as RecipientStatus | undefined,
        deliveredAt: data.deliveredAt,
        readAt: data.readAt,
        errorMessage: data.errorMessage,
      },
      include: {
        user: {
          select: {
            id: true,
            code: true,
            identityId: true,
            status: true,
          },
        },
      },
    });
    return this.recipientToDomain(recipient);
  }

  async findRecipientsByMessageId(
    messageId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageRecipient[]> {
    const prisma = tx ?? this.prisma;
    const recipients = await prisma.messageRecipient.findMany({
      where: { isDeleted: false, messageId },
      include: {
        user: {
          select: {
            id: true,
            code: true,
            identityId: true,
            status: true,
          },
        },
      },
    });
    return recipients.map((r) => this.recipientToDomain(r));
  }

  async findScheduledMessages(
    beforeDate: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<Message[]> {
    const prisma = tx ?? this.prisma;
    const messages = await prisma.message.findMany({
      where: {
        isDeleted: false,
        status: MessageStatus.SCHEDULED,
        scheduledAt: {
          lte: beforeDate,
        },
      },
      include: messageInclude,
    });
    return messages.map((m) => this.toDomain(m));
  }

  private toDomain(
    message: Prisma.MessageGetPayload<{ include: typeof messageInclude }>,
  ): Message {
    return {
      id: message.id,
      code: message.code,
      type: message.type as MessageType,
      status: message.status as MessageStatus,
      subject: message.subject,
      content: message.content,
      templateId: message.templateId,
      scheduledAt: message.scheduledAt,
      sentAt: message.sentAt,
      metadata: message.metadata as Record<string, unknown> | null,
      createdBy: message.createdBy,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      template: message.template
        ? {
            id: message.template.id,
            code: message.template.code,
            name: message.template.name,
            type: message.template.type as MessageType,
            subject: message.template.subject,
            content: message.template.content,
            variables: message.template.variables,
            isActive: message.template.isActive,
            createdBy: message.template.createdBy,
            createdAt: message.template.createdAt,
            updatedAt: message.template.updatedAt,
            isDeleted: message.template.isDeleted,
            deletedAt: message.template.deletedAt,
            deletedBy: message.template.deletedBy,
          }
        : undefined,
      recipients: message.recipients?.map((r) => this.recipientToDomain(r)),
      isDeleted: message.isDeleted,
      deletedAt: message.deletedAt,
      deletedBy: message.deletedBy,
    };
  }

  private recipientToDomain(recipient: RecipientWithUser): MessageRecipient {
    return {
      id: recipient.id,
      code: recipient.code,
      messageId: recipient.messageId,
      userId: recipient.userId,
      renderedContent: recipient.renderedContent ?? null,
      phone: recipient.phone,
      email: recipient.email,
      status: recipient.status as RecipientStatus,
      deliveredAt: recipient.deliveredAt,
      readAt: recipient.readAt,
      errorMessage: recipient.errorMessage,
      createdAt: recipient.createdAt,
      updatedAt: recipient.updatedAt,
      user: recipient.user
        ? ({
            id: recipient.user.id,
            code: recipient.user.code,
            identityId: recipient.user.identityId,
            status: recipient.user
              .status as unknown as import('@app/domain').UserStatus,
            identity:
              'identity' in recipient.user && recipient.user.identity
                ? {
                    id: recipient.user.identity.id,
                    phone: recipient.user.identity.phone,
                    name: recipient.user.identity.name,
                    countryCode: recipient.user.identity.countryCode,
                    email: recipient.user.identity.email,
                    createdAt: recipient.user.identity.createdAt,
                    updatedAt: recipient.user.identity.updatedAt,
                    isDeleted: recipient.user.identity.isDeleted,
                    deletedAt: recipient.user.identity.deletedAt,
                    deletedBy: recipient.user.identity.deletedBy,
                  }
                : undefined,
            isDeleted: false,
          } as import('@app/domain').User)
        : undefined,
      isDeleted: recipient.isDeleted,
      deletedAt: recipient.deletedAt,
      deletedBy: recipient.deletedBy,
    };
  }
}
