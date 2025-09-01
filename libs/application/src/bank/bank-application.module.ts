import { Module } from '@nestjs/common';
import { BankInfraModule } from '@app/infra/bank/bank.infra.module';
import { AccountTypesService } from './services/account-types.service';
import { AccountsService } from './services/accounts.service';

@Module({
  imports: [BankInfraModule],
  providers: [AccountTypesService, AccountsService],
  exports: [AccountTypesService, AccountsService],
})
export class BankApplicationModule {}
