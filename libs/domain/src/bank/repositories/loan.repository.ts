import { Loan } from '../entities/loan.entity';
import { CreateLoanInput, UpdateLoanInput } from '../types/loan.type';

export interface LoanRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Loan[]>;
  findById(id: string, tx?: unknown): Promise<Loan | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(input: CreateLoanInput, tx?: unknown): Promise<Loan>;
  update(id: string, input: UpdateLoanInput, tx?: unknown): Promise<Loan>;
  delete(id: string, tx?: unknown): Promise<void>;
}
