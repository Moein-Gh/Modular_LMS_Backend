export interface RecipientGroupCriteria {
  userStatus?: string;
  hasLoan?: boolean;
  hasAccount?: boolean;
  roles?: string[];
  customQuery?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RecipientGroup {
  id: string;
  code: number;
  name: string;
  description?: string | null;
  criteria: RecipientGroupCriteria;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
}
