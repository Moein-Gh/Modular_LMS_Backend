import { Bank } from '../entities/bank.entity';
import { CreateBankInput, UpdateBankInput } from '../types/bank.type';

export interface BankRepository {
  findOne(tx?: unknown): Promise<Bank | null>;
  create(input: CreateBankInput, tx?: unknown): Promise<Bank>;
  update(id: string, input: UpdateBankInput, tx?: unknown): Promise<Bank>;
}
