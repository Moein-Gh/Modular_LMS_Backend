import { BankInfraModule } from '@app/infra/bank/bank.infra.module';
import { LedgerInfraModule } from '@app/infra/ledger/ledger.infra.module';
import { PrismaLedgerAccountRepository } from '@app/infra/ledger/repositories/prisma-ledger-account.repository';
import { Module } from '@nestjs/common';
import { AccountTypesService } from './services/account-types.service';
import { AccountsService } from './services/accounts.service';
import { BankFinancialsService } from './services/bank-financials.service';
import { BankService } from './services/banks.service';
import { InstallmentsService } from './services/installments.service';
import { LoanTypesService } from './services/loan-types.service';
import { LoansService } from './services/loans.service';

@Module({
  imports: [BankInfraModule, LedgerInfraModule],
  providers: [
    {
      provide: 'LedgerAccountRepository',
      useClass: PrismaLedgerAccountRepository,
    },
    AccountTypesService,
    AccountsService,
    InstallmentsService,
    LoanTypesService,
    BankService,
    BankFinancialsService,
    LoansService,
  ],
  exports: [
    AccountTypesService,
    AccountsService,
    LoansService,
    InstallmentsService,
    LoanTypesService,
    BankService,
    BankFinancialsService,
  ],
})
export class BankApplicationModule {}
