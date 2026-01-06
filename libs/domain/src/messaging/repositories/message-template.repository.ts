import { MessageTemplate } from '../entities/message-template.entity';

export interface CreateMessageTemplateInput {
  name: string;
  type: string;
  subject?: string | null;
  content: string;
  variables: string[];
  isActive?: boolean;
  createdBy?: string | null;
}

export interface UpdateMessageTemplateInput {
  name?: string;
  subject?: string | null;
  content?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface IMessageTemplateRepository {
  findAll(options?: unknown, tx?: unknown): Promise<MessageTemplate[]>;
  findById(id: string, tx?: unknown): Promise<MessageTemplate | null>;
  findByName(name: string, tx?: unknown): Promise<MessageTemplate | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(
    data: CreateMessageTemplateInput,
    tx?: unknown,
  ): Promise<MessageTemplate>;
  update(
    id: string,
    data: UpdateMessageTemplateInput,
    tx?: unknown,
  ): Promise<MessageTemplate>;
  softDelete(id: string, tx?: unknown): Promise<void>;
  restore(id: string, tx?: unknown): Promise<MessageTemplate>;
}
