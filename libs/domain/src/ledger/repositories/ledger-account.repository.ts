import { LedgerAccount } from '../entities/ledger-account.entity';
import {
  CreateLedgerAccountInput,
  UpdateLedgerAccountInput,
} from '../types/ledger-account.type';

export interface LedgerAccountRepository {
  findAll(options?: unknown, tx?: unknown): Promise<LedgerAccount[]>;
  findById(id: string, tx?: unknown): Promise<LedgerAccount | null>;
  findByCode(code: string, tx?: unknown): Promise<LedgerAccount | null>;
  create(input: CreateLedgerAccountInput, tx?: unknown): Promise<LedgerAccount>;
  update(
    id: string,
    input: UpdateLedgerAccountInput,
    tx?: unknown,
  ): Promise<LedgerAccount>;
  delete(id: string, tx?: unknown): Promise<void>;
}
