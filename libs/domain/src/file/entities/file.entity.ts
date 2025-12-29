export interface File {
  id: string;
  code: number;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy?: string | null;
}
