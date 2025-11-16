import { BankInfraModule } from '@app/infra/bank/bank.infra.module';
import { LedgerInfraModule } from '@app/infra/ledger/ledger.infra.module';
import { PrismaLedgerAccountRepository } from '@app/infra/ledger/repositories/prisma-ledger-account.repository';
import { Module } from '@nestjs/common';
import { TransactionApplicationModule } from '../transaction/transaction-application.module';
import { AccountTypesService } from './services/account-types.service';
import { AccountsService } from './services/accounts.service';
import { BankFinancialsService } from './services/bank-financials.service';
import { BankService } from './services/banks.service';
import { InstallmentsService } from './services/installments.service';
import { LoanTypesService } from './services/loan-types.service';
import { LoansService } from './services/loans.service';
import { SubscriptionFeesService } from './services/subscription-fees.service';

@Module({
  imports: [BankInfraModule, LedgerInfraModule, TransactionApplicationModule],
  providers: [
    {
      provide: 'LedgerAccountRepository',
      useClass: PrismaLedgerAccountRepository,
    },
    AccountTypesService,
    AccountsService,
    InstallmentsService,
    SubscriptionFeesService,
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
    SubscriptionFeesService,
    LoanTypesService,
    BankService,
    BankFinancialsService,
  ],
})
export class BankApplicationModule {}
