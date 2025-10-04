export type CreateTransactionImageInput = {
  id: string;
  transactionId: string;
  fileId: string;
  description?: string;
  createdAt: Date;
};

export type UpdateTransactionImageInput = Partial<CreateTransactionImageInput>;
