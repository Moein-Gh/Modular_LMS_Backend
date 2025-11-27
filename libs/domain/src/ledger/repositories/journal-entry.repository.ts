import type { JournalEntry } from '../entities/journal-entry.entity';
import {
  CreateJournalEntryInput,
  JournalEntryUpdateManyInput,
  UpdateJournalEntryInput,
} from '../types/journal-entry.type';

export interface JournalEntryRepository {
  findAll(options?: unknown, tx?: unknown): Promise<JournalEntry[]>;
  findById(id: string, tx?: unknown): Promise<JournalEntry | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateJournalEntryInput, tx?: unknown): Promise<JournalEntry>;
  createMany(
    accounts: CreateJournalEntryInput[],
    tx?: unknown,
  ): Promise<JournalEntry[]>;
  update(
    id: string,
    account: UpdateJournalEntryInput,
    tx?: unknown,
  ): Promise<JournalEntry>;

  updateMany(
    where: unknown,
    account: JournalEntryUpdateManyInput,
    tx?: unknown,
  ): Promise<void>;
  delete(id: string, tx?: unknown): Promise<void>;
}
