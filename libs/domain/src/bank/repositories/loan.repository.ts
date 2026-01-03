import { Loan } from '../entities/loan.entity';
import { CreateLoanInput, UpdateLoanInput } from '../types/loan.type';

export interface LoanRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Loan[]>;
  findOne(options: unknown, tx?: unknown): Promise<Loan | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(input: CreateLoanInput, tx?: unknown): Promise<Loan>;
  update(id: string, input: UpdateLoanInput, tx?: unknown): Promise<Loan>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
}
