import { RecipientGroup } from '../entities/recipient-group.entity';

export interface CreateRecipientGroupInput {
  name: string;
  description?: string | null;
  criteria: Record<string, unknown>;
  isActive?: boolean;
  createdBy?: string | null;
}

export interface UpdateRecipientGroupInput {
  name?: string;
  description?: string | null;
  criteria?: Record<string, unknown>;
  isActive?: boolean;
}

export interface IRecipientGroupRepository {
  findAll(options?: unknown, tx?: unknown): Promise<RecipientGroup[]>;
  findById(id: string, tx?: unknown): Promise<RecipientGroup | null>;
  findByName(name: string, tx?: unknown): Promise<RecipientGroup | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(
    data: CreateRecipientGroupInput,
    tx?: unknown,
  ): Promise<RecipientGroup>;
  update(
    id: string,
    data: UpdateRecipientGroupInput,
    tx?: unknown,
  ): Promise<RecipientGroup>;
  softDelete(id: string, tx?: unknown): Promise<void>;
  restore(id: string, tx?: unknown): Promise<RecipientGroup>;
}
