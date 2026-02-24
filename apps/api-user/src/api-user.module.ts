import {
  AccessTokenGuard,
  AuthApplicationModule,
  BankApplicationModule,
  FileApplicationModule,
  JournalsService,
  LedgerAccountsService,
  TransactionApplicationModule,
} from '@app/application';
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
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccountsController } from './account/accounts.controller';
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';
import { DeviceController } from './auth/device.controller';
import { DashboardController } from './dashboard/dashboard.contoller';
import { InstallmentsController } from './installment/installments.controller';
import { JournalsController } from './journal/journals.controller';
import { LoanRequestsController } from './loan-request/loan-requests.controller';
import { LoansController } from './loans/loans.controller';
import { TransactionsController } from './transaction/transactions.controller';
import { UsersController } from './user/users.controller';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    AuthApplicationModule,
    UserApplicationModule,
    BankApplicationModule,
    FileApplicationModule,
    TransactionApplicationModule,
    ConfigModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    ApiUserController,
    DeviceController,
    LoanRequestsController,
    DashboardController,
    UsersController,
    TransactionsController,
    AccountsController,
    LoansController,
    InstallmentsController,
    JournalsController,
  ],
  providers: [
    ApiUserService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    JournalsService,
    LedgerAccountsService,
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
export class ApiUserModule {}
