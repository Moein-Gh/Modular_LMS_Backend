import {
  AccountBalanceResult,
  LoanBalanceResult,
} from '@app/application/ledger/dto/journal-balance.dto';
import { Identity, RoleAssignment } from '@app/domain';

export type UserBalanceSummary = {
  accounts: AccountBalanceResult[];
  loans: LoanBalanceResult[];
};

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
export interface User {
  id: string;
  code: number;
  identityId: string;
  status: UserStatus;
  identity?: Partial<Identity>;

  balanceSummary?: UserBalanceSummary;
  roleAssignments?: RoleAssignment[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface UserWithPermissions extends User {
  permissions: string[];
}
