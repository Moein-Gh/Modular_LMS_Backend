import type {
  CreateTransactionImageInput,
  TransactionImage,
  TransactionImageRepository,
  UpdateTransactionImageInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const selectTransactionImage = {
  id: true,
  transactionId: true,
  fileId: true,
  description: true,
  createdAt: true,
};

type TransactionImageModel = Prisma.TransactionImageGetPayload<{
  select: typeof selectTransactionImage;
}>;

function toDomain(model: TransactionImageModel): TransactionImage {
  return {
    id: model.id,
    transactionId: model.transactionId,
    fileId: model.fileId,
    description: model.description ?? undefined,
    createdAt: model.createdAt,
  };
}

@Injectable()
export class PrismaTransactionImageRepository
  implements TransactionImageRepository
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findAll(
    options?: Prisma.TransactionImageFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<TransactionImage[]> {
    const prisma = tx ?? this.prisma;
    const args: Prisma.TransactionImageFindManyArgs = {
      ...(options ?? {}),
      select: selectTransactionImage,
    };
    const transactionImages = await prisma.transactionImage.findMany(args);
    return transactionImages.map((t) => toDomain(t as TransactionImageModel));
  }

  async count(
    where?: Prisma.TransactionImageWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.transactionImage.count({ where: where });
  }

  async update(
    id: string,
    input: UpdateTransactionImageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TransactionImage> {
    const prisma = tx ?? this.prisma;

    const updated = await prisma.transactionImage.update({
      where: { id },
      data: input,
      select: selectTransactionImage,
    });
    return toDomain(updated as TransactionImageModel);
  }

  async create(
    input: CreateTransactionImageInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TransactionImage> {
    const prisma = tx ?? this.prisma;

    const transactionImage = await prisma.transactionImage.create({
      data: input,
      select: selectTransactionImage,
    });
    return toDomain(transactionImage as TransactionImageModel);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TransactionImage | null> {
    const prisma = tx ?? this.prisma;
    const transactionImage = await prisma.transactionImage.findUnique({
      where: { id },
      select: selectTransactionImage,
    });
    if (!transactionImage) return null;
    return toDomain(transactionImage as TransactionImageModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    console.log('🚀 -----------🚀');
    console.log('🚀 ~ id:', id);
    console.log('🚀 -----------🚀');

    const prisma = tx ?? this.prisma;

    await prisma.transactionImage.delete({ where: { id } });
  }
}
