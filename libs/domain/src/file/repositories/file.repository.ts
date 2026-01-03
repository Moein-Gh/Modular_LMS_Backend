import { File } from '../entities/file.entity';

export interface UploadInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface IFileRepository {
  upload(input: UploadInput, tx?: unknown): Promise<File>;
  findById(id: string, tx?: unknown): Promise<File | null>;
  findByCode(code: number, tx?: unknown): Promise<File | null>;
  findAll(options?: unknown, tx?: unknown): Promise<File[]>;
  softDelete(id: string, currentUserId: string, tx?: unknown): Promise<void>;
}
