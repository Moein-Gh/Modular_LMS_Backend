import { MessagingApplicationModule } from '@app/application/messaging';
import { DateModule } from '@app/date';
import { BankInfraModule } from '@app/infra/bank/bank.infra.module';
import { LedgerInfraModule } from '@app/infra/ledger/ledger.infra.module';
import { PrismaLedgerAccountRepository } from '@app/infra/ledger/repositories/prisma-ledger-account.repository';
import { Module } from '@nestjs/common';
import { LedgerApplicationModule } from '../ledger/ledger-application.module';
import { TransactionApplicationModule } from '../transaction/transaction-application.module';
import { LoanApprovedHandler } from './event-handlers/loan-approved-handler';
import { AccountTypesService } from './services/account-types.service';
import { AccountsService } from './services/accounts.service';
import { BankFinancialsService } from './services/bank-financials.service';
import { BankService } from './services/banks.service';
import { InstallmentsService } from './services/installments.service';
import { LoanRequestsService } from './services/loan-requests.service';
import { LoanTypesService } from './services/loan-types.service';
import { LoansService } from './services/loans.service';
import { SubscriptionFeesService } from './services/subscription-fees.service';

@Module({
  imports: [
    BankInfraModule,
    LedgerInfraModule,
    TransactionApplicationModule,
    MessagingApplicationModule,
    LedgerApplicationModule,
    DateModule,
  ],
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
    LoanRequestsService,
    BankService,
    BankFinancialsService,
    LoansService,
    LoanApprovedHandler,
  ],
  exports: [
    AccountTypesService,
    AccountsService,
    LoansService,
    InstallmentsService,
    SubscriptionFeesService,
    LoanTypesService,
    LoanRequestsService,
    BankService,
    BankFinancialsService,
  ],
})
export class BankApplicationModule {}
