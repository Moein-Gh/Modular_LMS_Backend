import { User } from '@app/domain/user';

export enum MessageType {
  SMS = 'SMS',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  EMAIL = 'EMAIL',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
}

export interface MessageMetadata {
  provider?: string;
  cost?: number;
  providerResponse?: Record<string, unknown>;
  errorDetails?: string;
  retryCount?: number;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  code: number;
  type: MessageType;
  status: MessageStatus;
  subject?: string | null;
  content: string;
  templateId?: string | null;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  metadata?: MessageMetadata | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  template?: unknown;
  recipients?: MessageRecipient[];
  createdByUser?: User;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export enum RecipientStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

export interface MessageRecipient {
  id: string;
  code: number;
  messageId: string;
  userId?: string | null;
  phone?: string | null;
  renderedContent?: string | null;
  email?: string | null;
  status: RecipientStatus;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  message?: Message;
  user?: User;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}
