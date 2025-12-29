export interface TransactionImage {
  id: string;
  transactionId: string;
  fileId: string;
  description?: string | null;
  createdAt: Date;
  ownerId?: string;
  createdBy?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}
