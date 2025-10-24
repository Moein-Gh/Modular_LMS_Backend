import {
  LedgerInfraModule,
  PrismaUserRepository,
  TransactionInfraModule,
} from '@app/infra';
import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [TransactionInfraModule, LedgerInfraModule],
  providers: [TransactionsService, PrismaUserRepository],
  exports: [TransactionsService],
})
export class TransactionApplicationModule {}
