import { LoanRequest } from '../entities/loan-request.entity';
import {
  CreateLoanRequestInput,
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
