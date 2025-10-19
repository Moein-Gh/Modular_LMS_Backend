export interface TransactionImage {
  id: string;
  transactionId: string;
  fileId: string;
  description?: string | null;
  createdAt: Date;
  // file: File;
}
