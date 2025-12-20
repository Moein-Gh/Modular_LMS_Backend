import {
  AccountBalanceResult,
  LoanBalanceResult,
} from '@app/application/ledger/dto/journal-balance.dto';
import { Identity, RoleAssignment } from '@app/domain';

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
  roleAssignments?: RoleAssignment[];
}

export interface UserWithPermissions extends User {
  permissions: string[];
}
