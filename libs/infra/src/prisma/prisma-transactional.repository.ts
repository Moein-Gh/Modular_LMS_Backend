import { Injectable } from '@nestjs/common';
import { TransactionalRepository } from '@app/domain';
import { Prisma } from '@generated/prisma';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionalRepository implements TransactionalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async withTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
