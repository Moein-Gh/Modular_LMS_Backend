import type {
  CreateTransactionImageInput,
  TransactionImage,
} from '@app/domain';
import { PrismaTransactionImageRepository } from '@app/infra/transaction/repositories/prisma-transaction-image.repository';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionImagesService {
  constructor(private readonly repo: PrismaTransactionImageRepository) {}

  async create(
    transactionId: string,
    fileId: string,
    description?: string | null,
  ): Promise<TransactionImage> {
    const input: CreateTransactionImageInput = {
      transactionId,
      fileId,
      description: description ?? undefined,
    };
    return this.repo.create(input);
  }

  async findAll(options?: Prisma.TransactionImageFindManyArgs) {
    return this.repo.findAll(options);
  }
}
