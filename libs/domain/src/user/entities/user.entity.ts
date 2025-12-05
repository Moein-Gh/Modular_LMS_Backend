import {
  AccountBalanceResult,
  LoanBalanceResult,
} from '@app/application/ledger/dto/journal-balance.dto';
import { Identity } from '@app/domain';

export type UserBalanceSummary = {
  accounts: AccountBalanceResult[];
  loans: LoanBalanceResult[];
};

export interface User {
  id: string;
  code: number;
  identityId: string;
  isActive: boolean;
  identity?: Partial<Identity>;

  balanceSummary?: UserBalanceSummary;
}

export interface UserWithPermissions extends User {
  permissions: string[];
}
