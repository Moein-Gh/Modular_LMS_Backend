import { LoanQueue } from '../entities/loan-queue.entity';
import { LoanRequest } from '../entities/loan-request.entity';
import {
  CreateLoanQueueInput,
  CreateLoanRequestInput,
  UpdateLoanQueueInput,
  UpdateLoanRequestInput,
} from '../types/loan-request.type';

export interface LoanRequestRepository {
  findAll(options?: unknown, tx?: unknown): Promise<LoanRequest[]>;
  findOne(options: unknown, tx?: unknown): Promise<LoanRequest | null>;
  findById(id: string, tx?: unknown): Promise<LoanRequest | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(input: CreateLoanRequestInput, tx?: unknown): Promise<LoanRequest>;
  update(
    id: string,
    input: UpdateLoanRequestInput,
    tx?: unknown,
  ): Promise<LoanRequest>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
  restore(id: string, tx?: unknown): Promise<void>;
}

export interface LoanQueueRepository {
  findAll(options?: unknown, tx?: unknown): Promise<LoanQueue[]>;
  findOne(options: unknown, tx?: unknown): Promise<LoanQueue | null>;
  findByLoanRequestId(
    loanRequestId: string,
    tx?: unknown,
  ): Promise<LoanQueue | null>;
  create(input: CreateLoanQueueInput, tx?: unknown): Promise<LoanQueue>;
  update(
    id: string,
    input: UpdateLoanQueueInput,
    tx?: unknown,
  ): Promise<LoanQueue>;
  updateOrder(id: string, newOrder: number, tx?: unknown): Promise<LoanQueue>;
  reorderQueue(tx?: unknown): Promise<void>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
  restore(id: string, tx?: unknown): Promise<void>;
  removeFromQueue(
    loanRequestId: string,
    currentUserId: string,
    tx?: unknown,
  ): Promise<void>;
}
