import { FILE_REPOSITORY, type IFileRepository } from '@app/domain';
import { Inject, Injectable } from '@nestjs/common';

export type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class FilesService {
  constructor(
    @Inject(FILE_REPOSITORY) private readonly repo: IFileRepository,
  ) {}

  async upload(file: UploadedFile) {
    const created = await this.repo.upload({
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    return created;
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async findAll() {
    return this.repo.findAll();
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
