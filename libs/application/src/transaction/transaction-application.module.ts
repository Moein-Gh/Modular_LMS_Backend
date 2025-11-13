import {
  LedgerInfraModule,
  PrismaUserRepository,
  TransactionInfraModule,
} from '@app/infra';
import { forwardRef, Module } from '@nestjs/common';
import { LedgerApplicationModule } from '../ledger/ledger-application.module';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [
    TransactionInfraModule,
    LedgerInfraModule,
    forwardRef(() => LedgerApplicationModule),
  ],
  providers: [TransactionsService, PrismaUserRepository],
  exports: [TransactionsService],
})
export class TransactionApplicationModule {}
