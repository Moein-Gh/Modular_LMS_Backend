import { MessageType, RecipientStatus } from '@app/domain';

export interface MessageJobData {
  messageId: string;
  type: MessageType;
  recipientId: string;
  userId?: string;
  phone?: string;
  email?: string;
  content: string;
  subject?: string;
}

export interface ScheduledMessageJobData {
  messageId: string;
}

export const MESSAGING_QUEUE = 'messaging';
export const SCHEDULED_MESSAGE_QUEUE = 'scheduled-messages';

export enum MessageJobType {
  SEND_SMS = 'send-sms',
  SEND_EMAIL = 'send-email',
  SEND_PUSH = 'send-push',
  PROCESS_SCHEDULED = 'process-scheduled',
}

export interface MessageJobResult {
  recipientId: string;
  status: RecipientStatus;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}
