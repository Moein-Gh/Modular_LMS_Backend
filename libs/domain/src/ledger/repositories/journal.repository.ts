import { Journal } from '../entities/journal.entity';
import { CreateJournalInput } from '../types/journal.type';

export interface JournalRepository {
  findById(id: string, tx?: unknown): Promise<Journal | null>;
  create(input: CreateJournalInput, tx?: unknown): Promise<Journal>;
  delete(options: unknown, tx?: unknown): Promise<void>;
  update(
    id: string,
    input: Partial<CreateJournalInput>,
    tx?: unknown,
  ): Promise<Journal | null>;
  updateMany(
    where: unknown,
    input: Partial<CreateJournalInput>,
    tx?: unknown,
  ): Promise<number>;

  findAll(options?: unknown, tx?: unknown): Promise<Journal[]>;
  count(where?: unknown, tx?: unknown): Promise<number>;
}
