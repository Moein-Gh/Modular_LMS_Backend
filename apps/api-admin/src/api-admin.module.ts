import {
  AuthApplicationModule,
  BankApplicationModule,
  FileApplicationModule,
  JournalsService,
  LedgerAccountsService,
  ReportApplicationModule,
  TransactionApplicationModule,
} from '@app/application';
import { JournalEntriesService } from '@app/application/ledger/journal-entries.service';
import { UserApplicationModule } from '@app/application/user/user-application.module';
import { ConfigModule } from '@app/config';
import {
  PrismaJournalEntryRepository,
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
} from '@app/infra';
import { PrismaModule } from '@app/infra/prisma/prisma.module';
import { LoggerModule } from '@app/logger';
import { ProblemDetailsModule } from '@app/problem-details';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccessModule } from './access/access.module';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { AuthController } from './auth/auth.controller';
import { AccountTypesController } from './bank/account-types.controller';
import { AccountsController } from './bank/accounts.controller';
import { BankFinancialsController } from './bank/bank-financials.controller';
import { InstallmentsController } from './bank/installments.controller';
import { LoanTypesController } from './bank/loan-types.controller';
import { LoansController } from './bank/loans.controller';
import { SubscriptionFeesController } from './bank/subscription-fees.controller';
import { FilesController } from './file/file.controller';
import { JournalEntriesController } from './ledger/journal-entries.controller';
import { JournalsController } from './ledger/journals.controller';
import { LedgerAccountsController } from './ledger/ledger-accounts.controller';
import { ReportController } from './report/report.controller';
import { TransactionsController } from './transactions/transactions.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    ConfigModule,
    AuthApplicationModule,
    UserApplicationModule,
    // File application
    FileApplicationModule,
    BankApplicationModule,
    TransactionApplicationModule,
    ReportApplicationModule,
    AccessModule,
  ],
  controllers: [
    ApiAdminController,
    // File controller
    FilesController,
    UsersController,
    AuthController,
    AccountsController,
    LoansController,
    InstallmentsController,
    SubscriptionFeesController,
    LoanTypesController,
    AccountTypesController,
    BankFinancialsController,
    TransactionsController,
    LedgerAccountsController,
    JournalsController,
    JournalEntriesController,
    ReportController,
  ],
  providers: [
    ApiAdminService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    LedgerAccountsService,
    JournalsService,
    JournalEntriesService,
    PrismaLedgerAccountRepository,
    {
      provide: 'LedgerAccountRepository',
      useClass: PrismaLedgerAccountRepository,
    },
    { provide: 'JournalRepository', useClass: PrismaJournalRepository },
    {
      provide: 'JournalEntryRepository',
      useClass: PrismaJournalEntryRepository,
    },
  ],
})
export class ApiAdminModule {}
