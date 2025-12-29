export interface AccountType {
  id: string;
  code: number;
  name: string;
  maxAccounts: number | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
