import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaJournalRepository } from './repositories/prisma-journal.repository';
import { PrismaLedgerAccountRepository } from './repositories/prisma-ledger-account.repository';

@Module({
  imports: [PrismaModule],
  providers: [PrismaLedgerAccountRepository, PrismaJournalRepository],
  exports: [PrismaLedgerAccountRepository, PrismaJournalRepository],
})
export class LedgerInfraModule {}
