import {
  BankInfraModule,
  LedgerInfraModule,
  PrismaUserRepository,
  TransactionInfraModule,
} from '@app/infra';
import { forwardRef, Module } from '@nestjs/common';
import { BankApplicationModule } from '../bank/bank-application.module';
import { FileApplicationModule } from '../file';
import { LedgerApplicationModule } from '../ledger/ledger-application.module';
import { TransactionImagesService } from './services/transaction-images.service';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [
    TransactionInfraModule,
    LedgerInfraModule,
    BankInfraModule,
    forwardRef(() => LedgerApplicationModule),
    forwardRef(() => BankApplicationModule),
    FileApplicationModule,
  ],
  providers: [
    TransactionsService,
    TransactionImagesService,
    PrismaUserRepository,
  ],
  exports: [TransactionsService, TransactionImagesService],
})
export class TransactionApplicationModule {}
