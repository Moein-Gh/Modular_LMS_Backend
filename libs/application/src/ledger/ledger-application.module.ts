import {
  BankInfraModule,
  PrismaJournalEntryRepository,
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
} from '@app/infra';
import { LedgerInfraModule } from '@app/infra/ledger/ledger.infra.module';
import { Module } from '@nestjs/common';
import { JournalBalanceUsecase } from './journal-balance.usecase';
import { JournalsService } from './journals.service';
import { LedgerAccountsService } from './ledger-accounts.service';

@Module({
  imports: [LedgerInfraModule, BankInfraModule],
  providers: [
    {
      provide: 'LedgerAccountRepository',
      useClass: PrismaLedgerAccountRepository,
    },
    {
      provide: 'JournalRepository',
      useClass: PrismaJournalRepository,
    },
    {
      provide: 'JournalEntryRepository',
      useClass: PrismaJournalEntryRepository,
    },
    JournalsService,
    LedgerAccountsService,
    JournalBalanceUsecase,
  ],
  exports: [
    'LedgerAccountRepository',
    'JournalRepository',
    'JournalEntryRepository',
    JournalsService,
    LedgerAccountsService,
    JournalBalanceUsecase,
  ],
})
export class LedgerApplicationModule {}
