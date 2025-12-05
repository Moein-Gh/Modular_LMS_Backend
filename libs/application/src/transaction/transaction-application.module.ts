import {
  BankInfraModule,
  LedgerInfraModule,
  PrismaUserRepository,
  TransactionInfraModule,
} from '@app/infra';
import { forwardRef, Module } from '@nestjs/common';
import { LedgerApplicationModule } from '../ledger/ledger-application.module';
import { TransactionImagesService } from './services/transaction-images.service';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [
    TransactionInfraModule,
    LedgerInfraModule,
    BankInfraModule,
    forwardRef(() => LedgerApplicationModule),
  ],
  providers: [
    TransactionsService,
    TransactionImagesService,
    PrismaUserRepository,
  ],
  exports: [TransactionsService, TransactionImagesService],
})
export class TransactionApplicationModule {}
