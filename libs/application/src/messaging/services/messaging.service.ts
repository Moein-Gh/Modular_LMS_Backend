import { BadRequestError } from '@app/application/errors/bad-request.error';
import { NotFoundError } from '@app/application/errors/not-found.error';
import {
  MESSAGE_REPOSITORY,
  Message,
  MessageRecipient,
  MessageStatus,
  MessageType,
  RecipientStatus,
  UserStatus,
  type CreateMessageInput,
  type UpdateMessageInput,
  type UpdateMessageRecipientInput,
} from '@app/domain';
import { PrismaMessageRepository, PrismaUserRepository } from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MessageTemplateService } from './message-template.service';
import { RecipientGroupService } from './recipient-group.service';

export type MetaDataValue =
  | string
  | number
  | boolean
  | Date
  | null
  | MetaDataValue[];

export type MetaDataType = Record<string, MetaDataValue>;

interface SendMessageInput {
  type: MessageType;
  content?: string;
  subject?: string;
  templateId?: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
  userIds?: string[];
  phones?: string[];
  emails?: string[];
  recipientGroupId?: string;
  recipients?: Array<{
    userId?: string;
    phone?: string;
    email?: string;
    metadata?: Record<string, unknown>;
  }>;
}

@Injectable()
export class MessagingService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepo: PrismaMessageRepository,
    private readonly templateService: MessageTemplateService,
    private readonly groupService: RecipientGroupService,
    private readonly userRepo: PrismaUserRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    @InjectQueue('messaging') private readonly messagingQueue?: Queue,
    @InjectQueue('scheduled-messages') private readonly scheduledQueue?: Queue,
  ) {}

  async sendMessage(
    input: SendMessageInput,
    currentUserId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Message> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // Prepare base template (raw) and subject template
      let baseTemplate = input.content;
      let baseSubjectTemplate = input.subject;
      let templateObj: { content: string; subject?: string | null } | undefined;

      if (input.templateId) {
        templateObj = await this.templateService.findById(
          input.templateId,
          DBtx,
        );
        if (!templateObj) {
          throw new NotFoundError('MessageTemplate', 'id', input.templateId);
        }
        baseTemplate = templateObj.content;
        if (templateObj.subject) baseSubjectTemplate = templateObj.subject;
      }

      // Ensure we have a template to render: either provided `content` or a template's content
      if (!baseTemplate) {
        throw new BadRequestError(
          'Either `content` or a valid `templateId` must be provided to send a message.',
        );
      }

      // Create message
      const messageData: CreateMessageInput = {
        type: input.type,
        status: input.scheduledAt
          ? MessageStatus.SCHEDULED
          : MessageStatus.PENDING,
        subject: baseSubjectTemplate,
        // store base template (un-rendered) so recipient-level renderedContent is the true per-recipient body
        content: baseTemplate,
        templateId: input.templateId,
        scheduledAt: input.scheduledAt,
        metadata: input.metadata,
        createdBy: currentUserId,
      };

      const message = await this.messageRepo.create(messageData, DBtx);

      // Resolve recipients
      const recipients = await this.resolveRecipients(input, DBtx);

      // Create recipient records with per-recipient rendered content
      for (const recipient of recipients) {
        // Fetch user info when available to allow template rendering with user fields
        let user = undefined;
        if (recipient.userId) {
          try {
            user = await this.userRepo.findById(recipient.userId, DBtx);
          } catch {
            user = undefined;
          }
        }

        const renderVars: Record<string, unknown> = {
          ...(input.metadata || {}),
        };

        // Merge per-recipient metadata (recipient-level overrides message-level)
        if (recipient.metadata && typeof recipient.metadata === 'object') {
          Object.assign(renderVars, recipient.metadata);
        }

        if (user) {
          renderVars.userId = user.id;

          const identity = user.identity;
          if (identity) {
            if (identity.name) {
              renderVars.fullName = identity.name;
              const parts = String(identity.name).split(/\s+/).filter(Boolean);
              if (parts.length > 0) renderVars.firstName = parts[0];
              if (parts.length > 1)
                renderVars.lastName = parts.slice(1).join(' ');
            }
            if (identity.email) renderVars.email = identity.email;
            if (identity.phone) renderVars.phone = identity.phone;
            if (identity.countryCode)
              renderVars.countryCode = identity.countryCode;
          }
        }

        // recipient-specific overrides
        if (recipient.phone) renderVars.phone = recipient.phone;
        if (recipient.email) renderVars.email = recipient.email;

        const rendered = this.renderTemplate(baseTemplate, renderVars);

        await this.messageRepo.createRecipient(
          {
            messageId: message.id,
            userId: recipient.userId,
            phone: recipient.phone,
            email: recipient.email,
            renderedContent: rendered,
            status: RecipientStatus.PENDING,
          },
          DBtx,
        );
      }

      const messageWithRecipients =
        (await this.messageRepo.findByIdWithRecipients(
          message.id,
          DBtx,
        )) as Message;

      // Enqueue jobs: immediate sends per recipient, or schedule a delayed processor job
      try {
        if (input.scheduledAt) {
          // schedule a delayed job to process the whole message
          const delay = input.scheduledAt.getTime() - Date.now();
          if (this.scheduledQueue) {
            await this.scheduledQueue.add(
              'process-scheduled',
              { messageId: message.id },
              { delay: Math.max(0, delay) },
            );
          }
        } else {
          // immediate: enqueue a job per resolved recipient
          if (this.messagingQueue && messageWithRecipients.recipients) {
            for (const recipient of messageWithRecipients.recipients) {
              const jobData = {
                messageId: message.id,
                type: message.type,
                recipientId: recipient.id,
                userId: recipient.userId ?? undefined,
                phone: recipient.phone ?? undefined,
                email: recipient.email ?? undefined,
                content: recipient.renderedContent ?? message.content,
                subject: message.subject ?? undefined,
              } as const;

              const jobName =
                message.type === MessageType.SMS
                  ? 'send-sms'
                  : message.type === MessageType.EMAIL
                    ? 'send-email'
                    : 'send-push';

              await this.messagingQueue.add(jobName, jobData, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to enqueue messaging jobs:', err);
      }

      return messageWithRecipients;
    };

    if (tx) return run(tx);
    return this.prismaTransactionalRepo.withTransaction(run);
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Message> {
    if (tx) {
      const message = await this.messageRepo.findById(id, tx);
      if (!message) {
        throw new NotFoundError('Message', 'id', id);
      }
      return message;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findById(id, t),
    );
  }

  async findAll(
    options?: Prisma.MessageFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Message[]> {
    if (tx) {
      return this.messageRepo.findAll(options, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findAll(options, t),
    );
  }

  async update(
    id: string,
    input: UpdateMessageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Message> {
    if (tx) {
      return this.messageRepo.update(id, input, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.update(id, input, t),
    );
  }

  async updateRecipientStatus(
    recipientId: string,
    input: UpdateMessageRecipientInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MessageRecipient> {
    if (tx) {
      return this.messageRepo.updateRecipient(recipientId, input, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.updateRecipientStatus(recipientId, input, t),
    );
  }

  async findScheduledMessages(
    beforeDate: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<Message[]> {
    if (tx) {
      return this.messageRepo.findScheduledMessages(beforeDate, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findScheduledMessages(beforeDate, t),
    );
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    if (tx) {
      await this.messageRepo.softDelete(id, tx);
      return;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.softDelete(id, t),
    );
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<Message> {
    if (tx) {
      return this.messageRepo.restore(id, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.restore(id, t),
    );
  }

  private async resolveRecipients(
    input: SendMessageInput,
    tx: Prisma.TransactionClient,
  ): Promise<
    Array<{
      userId?: string;
      phone?: string;
      email?: string;
      metadata?: Record<string, unknown>;
    }>
  > {
    const recipients: Array<{
      userId?: string;
      phone?: string;
      email?: string;
      metadata?: Record<string, unknown>;
    }> = [];

    // Add direct user IDs
    if (input.userIds && input.userIds.length > 0) {
      for (const userId of input.userIds) {
        recipients.push({ userId });
      }
    }

    // Add direct phones
    if (input.phones && input.phones.length > 0) {
      for (const phone of input.phones) {
        recipients.push({ phone });
      }
    }

    // Add direct emails
    if (input.emails && input.emails.length > 0) {
      for (const email of input.emails) {
        recipients.push({ email });
      }
    }

    // Add explicit recipients with optional per-recipient metadata
    if (input.recipients && input.recipients.length > 0) {
      for (const r of input.recipients) {
        recipients.push({
          userId: r.userId,
          phone: r.phone,
          email: r.email,
          metadata: r.metadata,
        });
      }
    }

    // Resolve group members
    if (input.recipientGroupId) {
      const group = await this.groupService.findById(
        input.recipientGroupId,
        tx,
      );
      const groupMembers = await this.resolveGroupMembers(group.criteria, tx);
      recipients.push(...groupMembers);
    }

    return recipients;
  }

  private async resolveGroupMembers(
    criteria: Record<string, unknown>,
    tx: Prisma.TransactionClient,
  ): Promise<Array<{ userId: string }>> {
    // Build Prisma where clause from criteria
    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (criteria.userStatus) {
      where.status = criteria.userStatus as UserStatus;
    }

    if (criteria.hasLoan) {
      where.loans = {
        some: {
          isDeleted: false,
        },
      };
    }

    if (criteria.hasAccount) {
      where.accounts = {
        some: {
          isDeleted: false,
        },
      };
    }

    const users = await this.userRepo.findAll({ where }, tx);
    return users.map((user) => ({ userId: user.id }));
  }

  private renderTemplate(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    return template.replace(/{{\s*([^}]+)\s*}}/g, (_match, path: string) => {
      const parts = path.split('.');
      let val: unknown = variables;
      for (const p of parts) {
        if (val === undefined || val === null) break;
        if (typeof val === 'object' && val !== null && p in val) {
          val = (val as Record<string, unknown>)[p];
        } else {
          val = undefined;
          break;
        }
      }
      if (val === undefined || val === null) return '';
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val);
        } catch {
          return '';
        }
      }
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean'
      ) {
        return String(val);
      }
      return '';
    });
  }

  async count(
    where?: Prisma.MessageWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    if (tx) {
      return this.messageRepo.count(where, tx);
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.count(where, t),
    );
  }
}
