export enum JournalStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED',
}

export interface Journal {
  id: string;
  transactionId?: string;
  postedAt?: Date;
  note?: string;
  status: JournalStatus;
  createdAt: Date;
  updatedAt: Date;

  // Add transaction here after implementing it
}
