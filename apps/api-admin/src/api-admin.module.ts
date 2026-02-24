import {
  AccessTokenGuard,
  AuthApplicationModule,
  BankApplicationModule,
  FileApplicationModule,
  JournalsService,
  LedgerAccountsService,
  MessagingApplicationModule,
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
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccessModule } from './access/access.module';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { AuthController } from './auth/auth.controller';
import { AccountTypesController } from './bank/account-types.controller';
import { AccountsController } from './bank/accounts.controller';
import { BankFinancialsController } from './bank/bank-financials.controller';
import { InstallmentsController } from './bank/installments.controller';
import { LoanRequestsController } from './bank/loan-requests.controller';
import { LoanTypesController } from './bank/loan-types.controller';
import { LoansController } from './bank/loans.controller';
import { SubscriptionFeesController } from './bank/subscription-fees.controller';
import { PermissionLoaderMiddleware } from './common/middleware/permission-loader.middleware';
import { FilesController } from './file/file.controller';
import { JournalEntriesController } from './ledger/journal-entries.controller';
import { JournalsController } from './ledger/journals.controller';
import { LedgerAccountsController } from './ledger/ledger-accounts.controller';
import { MessageTemplateController } from './messaging/message-template.controller';
import { MessagingController } from './messaging/messaging.controller';
import { RecipientGroupController } from './messaging/recipient-group.controller';
import { ReportController } from './report/report.controller';
import { TransactionsController } from './transactions/transactions.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({ ttl: 60, isGlobal: true }),
    LoggerModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    ConfigModule,
    EventEmitterModule.forRoot(),
    AuthApplicationModule,
    UserApplicationModule,
    // File application
    FileApplicationModule,
    BankApplicationModule,
    TransactionApplicationModule,
    ReportApplicationModule,
    MessagingApplicationModule,
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
    LoanRequestsController,
    AccountTypesController,
    BankFinancialsController,
    TransactionsController,
    LedgerAccountsController,
    JournalsController,
    JournalEntriesController,
    ReportController,
    // Messaging controllers
    MessagingController,
    MessageTemplateController,
    RecipientGroupController,
  ],
  providers: [
    ApiAdminService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
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
export class ApiAdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PermissionLoaderMiddleware).forRoutes('*path');
  }
}
