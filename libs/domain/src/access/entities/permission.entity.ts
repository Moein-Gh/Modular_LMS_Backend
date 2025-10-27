export interface Permission {
  id: string;
  code: number;
  key: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
