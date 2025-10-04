import { TransactionImage } from '../entities/transaction-image.entity';
import {
  CreateTransactionImageInput,
  UpdateTransactionImageInput,
} from '../types/transaction-image.type';

export interface TransactionImageRepository {
  findAll(options?: unknown, tx?: unknown): Promise<TransactionImage[]>;
  findById(id: string, tx?: unknown): Promise<TransactionImage | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(
    account: CreateTransactionImageInput,
    tx?: unknown,
  ): Promise<TransactionImage>;
  update(
    id: string,
    account: UpdateTransactionImageInput,
    tx?: unknown,
  ): Promise<TransactionImage>;
  delete(id: string, tx?: unknown): Promise<void>;
}
