import {
  PrismaJournalEntryRepository,
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
} from '@app/infra';
import { LedgerInfraModule } from '@app/infra/ledger/ledger.infra.module';
import { Module } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { LedgerAccountsService } from './ledger-accounts.service';

@Module({
  imports: [LedgerInfraModule],
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
  ],
  exports: [
    'LedgerAccountRepository',
    'JournalRepository',
    'JournalEntryRepository',
    JournalsService,
    LedgerAccountsService,
  ],
})
export class LedgerApplicationModule {}
