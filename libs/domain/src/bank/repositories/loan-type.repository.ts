import { LoanType } from '../entities/loan-type.entity';
import {
  CreateLoanTypeInput,
  UpdateLoanTypeInput,
} from '../types/loan-type.type';

export interface LoanTypeRepository {
  findAll(options?: unknown, tx?: unknown): Promise<LoanType[]>;
  findById(id: string, tx?: unknown): Promise<LoanType | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(input: CreateLoanTypeInput, tx?: unknown): Promise<LoanType>;
  update(
    id: string,
    input: UpdateLoanTypeInput,
    tx?: unknown,
  ): Promise<LoanType>;
  delete(id: string, tx?: unknown): Promise<void>;
}
