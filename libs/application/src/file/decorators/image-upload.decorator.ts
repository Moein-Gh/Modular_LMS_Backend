import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const ImageUpload = (
  fieldName = 'image',
  maxSize = 5 * 1024 * 1024,
): MethodDecorator =>
  UseInterceptors(
    FileInterceptor(fieldName, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png/;
        cb(
          allowed.test(file.mimetype) ? null : new Error('Invalid file type'),
          allowed.test(file.mimetype),
        );
      },
      limits: { fileSize: maxSize },
    }),
  );

export default ImageUpload;
