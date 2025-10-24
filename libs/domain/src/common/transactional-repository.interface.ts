import { Prisma } from '@generated/prisma';

export interface TransactionalRepository {
  withTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}
