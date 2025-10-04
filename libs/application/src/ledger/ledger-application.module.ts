import { LedgerInfraModule } from '@app/infra/ledger/ledger.infra.module';
import { Module } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { LedgerAccountsService } from './ledger-accounts.service';

@Module({
  imports: [LedgerInfraModule],
  providers: [LedgerAccountsService, JournalsService],
  exports: [LedgerAccountsService, JournalsService],
})
export class LedgerApplicationModule {}
