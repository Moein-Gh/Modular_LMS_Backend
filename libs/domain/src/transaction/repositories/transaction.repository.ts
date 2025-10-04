import { Transaction } from '../entities/transaction.entity';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../types/transaction.type';

export interface TransactionRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Transaction[]>;
  findById(id: string, tx?: unknown): Promise<Transaction | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(account: CreateTransactionInput, tx?: unknown): Promise<Transaction>;
  update(
    id: string,
    account: UpdateTransactionInput,
    tx?: unknown,
  ): Promise<Transaction>;
  delete(id: string, tx?: unknown): Promise<void>;
}
