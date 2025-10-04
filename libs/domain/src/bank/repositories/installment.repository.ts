import { Installment } from '../entities/installment.entity';
import {
  CreateInstallmentInput,
  UpdateInstallmentInput,
} from '../types/installment.type';

export interface InstallmentRepository {
  findAll(options?: unknown, tx?: unknown): Promise<Installment[]>;
  findById(id: string, tx?: unknown): Promise<Installment | null>;
  count(where?: unknown, tx?: unknown): Promise<number>;
  create(input: CreateInstallmentInput, tx?: unknown): Promise<Installment>;
  update(
    id: string,
    input: UpdateInstallmentInput,
    tx?: unknown,
  ): Promise<Installment>;
  delete(id: string, tx?: unknown): Promise<void>;
}
