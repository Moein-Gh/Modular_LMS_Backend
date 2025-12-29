export enum LedgerAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum LedgerAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  nameFa?: string;
  type: LedgerAccountType;
  status: LedgerAccountStatus;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  updatedAt: Date;
}
