import { Message, MessageRecipient } from '../entities/message.entity';

export interface CreateMessageInput {
  type: string;
  status: string;
  subject?: string | null;
  content: string;
  templateId?: string | null;
  scheduledAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export interface UpdateMessageInput {
  status?: string;
  sentAt?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateMessageRecipientInput {
  messageId: string;
  userId?: string | null;
  phone?: string | null;
  renderedContent?: string | null;
  email?: string | null;
  status: string;
}

export interface UpdateMessageRecipientInput {
  status?: string;
  readAt?: Date | null;
  deliveredAt?: Date | null;
  errorMessage?: string | null;
}

export interface IMessageRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Message[]>;
  findById(id: string, tx?: unknown): Promise<Message | null>;
  findByIdWithRecipients(id: string, tx?: unknown): Promise<Message | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(data: CreateMessageInput, tx?: unknown): Promise<Message>;
  update(id: string, data: UpdateMessageInput, tx?: unknown): Promise<Message>;
  softDelete(id: string, tx?: unknown): Promise<void>;
  restore(id: string, tx?: unknown): Promise<Message>;

  // Recipient operations
  createRecipient(
    data: CreateMessageRecipientInput,
    tx?: unknown,
  ): Promise<MessageRecipient>;
  updateRecipient(
    id: string,
    data: UpdateMessageRecipientInput,
    tx?: unknown,
  ): Promise<MessageRecipient>;
  markRecipientsAsRead(
    userId: string,
    messageIds: string[],
    tx?: unknown,
  ): Promise<void>;
  findRecipientsByMessageId(
    messageId: string,
    tx?: unknown,
  ): Promise<MessageRecipient[]>;

  // Scheduled messages
  findScheduledMessages(beforeDate: Date, tx?: unknown): Promise<Message[]>;
}
