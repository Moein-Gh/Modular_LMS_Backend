import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaTransactionRepository } from './repositories/prisma-transaction.repository';

@Module({
  imports: [PrismaModule],
  providers: [PrismaTransactionRepository],
  exports: [PrismaTransactionRepository],
})
export class TransactionInfraModule {}
