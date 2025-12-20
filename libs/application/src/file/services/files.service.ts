import { FILE_REPOSITORY, type File, type IFileRepository } from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
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
    private readonly transactionalRepository: PrismaTransactionalRepository,
  ) {}

  async upload(
    file: UploadedFile,
    tx?: Prisma.TransactionClient,
  ): Promise<File> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return this.repo.upload(
        {
          buffer: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        DBtx,
      );
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepository.withTransaction(run);
    }
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<File | null> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return this.repo.findById(id, DBtx);
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepository.withTransaction(run);
    }
  }

  async findAll(tx?: Prisma.TransactionClient): Promise<File[]> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return this.repo.findAll(undefined, DBtx);
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepository.withTransaction(run);
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const exists = await this.repo.findById(id, DBtx);

      if (!exists) {
        throw new Error(`File with id ${id} not found`);
      }

      await this.repo.delete(id, DBtx);
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepository.withTransaction(run);
    }
  }
}
