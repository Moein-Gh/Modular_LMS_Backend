import { SubscriptionFee } from '../entities/subscription-fee.entity';
import {
  CreateSubscriptionFeeInput,
  UpdateSubscriptionFeeInput,
} from '../types/subscription-fee.type';

export interface SubscriptionFeeRepository {
  findAll(options?: unknown, tx?: unknown): Promise<SubscriptionFee[]>;
  findById(id: string, tx?: unknown): Promise<SubscriptionFee | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(
    input: CreateSubscriptionFeeInput,
    tx?: unknown,
  ): Promise<SubscriptionFee>;
  update(
    id: string,
    input: UpdateSubscriptionFeeInput,
    tx?: unknown,
  ): Promise<SubscriptionFee>;
  delete(id: string, tx?: unknown): Promise<void>;
  deleteMany?(where: unknown, tx?: unknown): Promise<void>;
}
