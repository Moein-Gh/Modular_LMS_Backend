export type CreateTransactionImageInput = {
  transactionId: string;
  fileId: string;
  description?: string;
};

export type UpdateTransactionImageInput = Partial<CreateTransactionImageInput>;
