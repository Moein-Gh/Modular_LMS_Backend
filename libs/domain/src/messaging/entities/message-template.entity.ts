import { Message, MessageType } from './message.entity';

export interface MessageTemplate {
  id: string;
  code: number;
  name: string;
  type: MessageType;
  subject?: string | null;
  content: string;
  variables: string[];
  isActive: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;

  // Relations
  messages?: Message[];
}
