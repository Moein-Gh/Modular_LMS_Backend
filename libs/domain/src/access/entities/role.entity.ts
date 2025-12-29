export interface Role {
  id: string;
  code: number;
  name: string;
  key: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;

  userCount?: number;
}
