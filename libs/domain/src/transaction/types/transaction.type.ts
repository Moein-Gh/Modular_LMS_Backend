import { JournalEntrySpec } from '@app/domain/ledger';
import {
  TransactionKind,
  TransactionStatus,
} from '../entities/transaction.entity';

export type CreateTransactionInput = {
  userId: string;
  kind: TransactionKind;
  amount: string;
  externalRef?: string | null;
  note?: string | null;
  status: TransactionStatus;
};

export type CreateTransactionWithJournalEntriesInput =
  CreateTransactionInput & {
    journalEntries: JournalEntrySpec[];
  };

export type UpdateTransactionInput = Partial<CreateTransactionInput>;
