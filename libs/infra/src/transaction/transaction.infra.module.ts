import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaTransactionImageRepository } from './repositories/prisma-transaction-image.repository';
import { PrismaTransactionRepository } from './repositories/prisma-transaction.repository';

@Module({
  imports: [PrismaModule],
  providers: [PrismaTransactionRepository, PrismaTransactionImageRepository],
  exports: [PrismaTransactionRepository, PrismaTransactionImageRepository],
})
export class TransactionInfraModule {}
