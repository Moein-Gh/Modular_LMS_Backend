import {
  LedgerAccount,
  LedgerAccountStatus,
} from '../entities/ledger-account.entity';

export type CreateLedgerAccountInput = Pick<
  LedgerAccount,
  'code' | 'name' | 'type'
> & { status?: LedgerAccountStatus };

export type UpdateLedgerAccountInput = Partial<
  Pick<LedgerAccount, 'name' | 'type' | 'status'>
>;
