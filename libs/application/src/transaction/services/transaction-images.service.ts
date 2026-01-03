import { NotFoundError } from '@app/application/errors/not-found.error';
import { FilesService } from '@app/application/file';
import type {
  CreateTransactionImageInput,
  TransactionImage,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { PrismaTransactionImageRepository } from '@app/infra/transaction/repositories/prisma-transaction-image.repository';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionImagesService {
  constructor(
    private readonly repo: PrismaTransactionImageRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(
    transactionId: string,
    fileId: string,
    description?: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<TransactionImage> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const input: CreateTransactionImageInput = {
        transactionId,
        fileId,
        description: description ?? undefined,
      };
      return this.repo.create(input, DBtx);
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.prismaTransactionalRepo.withTransaction(run);
    }
  }

  async findAll(
    options?: Prisma.TransactionImageFindManyArgs,
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return this.repo.findAll(options, DBtx);
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.prismaTransactionalRepo.withTransaction(run);
    }
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const exists = await this.repo.findById(id, DBtx);

      if (!exists) {
        throw new NotFoundError('Transaction Image', 'id', id);
      }

      if (exists?.fileId)
        await this.filesService.softDelete(exists?.fileId, currentUserId, DBtx);
      await this.repo.delete(id, DBtx);
    };
    if (tx) {
      return await run(tx);
    } else {
      return await this.prismaTransactionalRepo.withTransaction(run);
    }
  }
}
