import { Module } from '@nestjs/common';
import { BankInfraModule } from '@app/infra/bank/bank.infra.module';
import { AccountTypesService } from './services/account-types.service';
import { AccountsService } from './services/accounts.service';
import { BankService } from './services/bank.service';

@Module({
  imports: [BankInfraModule],
  providers: [AccountTypesService, AccountsService, BankService],
  exports: [AccountTypesService, AccountsService, BankService],
})
export class BankApplicationModule {}
