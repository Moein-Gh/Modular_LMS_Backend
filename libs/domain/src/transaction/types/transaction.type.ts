import { BaseQueryParams } from '@app/domain/common';
import { JournalEntrySpec, JournalEntryTarget } from '@app/domain/ledger';
import {
  TransactionKind,
  TransactionStatus,
} from '../entities/transaction.entity';

export type ListTransactionParams = BaseQueryParams & {
  userId?: string;
  kind?: TransactionKind;
  status?: TransactionStatus;
  accountId?: string;
  targetType?: JournalEntryTarget;
  targetId?: string;
};

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

export type CreateTransferTransactionInput = {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  description?: string | null;
};
