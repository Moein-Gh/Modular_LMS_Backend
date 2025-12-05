import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';

export interface UploadOptions {
  fieldName?: string;
  destDir?: string;
  maxFileSize?: number;
}

export function UploadFile(options: UploadOptions = {}) {
  const fieldName = options.fieldName ?? 'image';
  const destDir =
    options.destDir ?? path.join(process.cwd(), 'uploads', 'files');
  const maxFileSize = options.maxFileSize ?? 5 * 1024 * 1024;

  const storage = diskStorage({
    destination: (_req, _file, cb) => {
      try {
        fs.mkdirSync(destDir, { recursive: true });
      } catch {
        // ignore
      }
      cb(null, destDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });

  const fileFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = /jpeg|jpg|png/;
    cb(
      allowed.test(file.mimetype) ? null : new Error('Invalid file type'),
      allowed.test(file.mimetype),
    );
  };

  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    UseInterceptors(
      FileInterceptor(fieldName, {
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize },
      }),
    ),
  );
}
