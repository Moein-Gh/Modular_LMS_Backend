import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaJournalEntryRepository } from './repositories/prisma-journal-entry.repository';
import { PrismaJournalRepository } from './repositories/prisma-journal.repository';
import { PrismaLedgerAccountRepository } from './repositories/prisma-ledger-account.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaLedgerAccountRepository,
    PrismaJournalRepository,
    PrismaJournalEntryRepository,
  ],
  exports: [
    PrismaLedgerAccountRepository,
    PrismaJournalRepository,
    PrismaJournalEntryRepository,
  ],
})
export class LedgerInfraModule {}
