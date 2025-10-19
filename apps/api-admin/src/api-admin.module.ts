import {
  AuthApplicationModule,
  BankApplicationModule,
  JournalsService,
  LedgerAccountsService,
  TransactionApplicationModule,
} from '@app/application';
import { UserApplicationModule } from '@app/application/user/user-application.module';
import { ConfigModule } from '@app/config';
import {
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
import { InstallmentsController } from './bank/installments.controller';
import { LoanTypesController } from './bank/loan-types.controller';
import { LoansController } from './bank/loans.controller';
import { JournalsController } from './ledger/journals.controller';
import { LedgerAccountsController } from './ledger/ledger-accounts.controller';
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
    BankApplicationModule,
    TransactionApplicationModule,
    AccessModule,
  ],
  controllers: [
    ApiAdminController,
    UsersController,
    AuthController,
    AccountsController,
    LoansController,
    InstallmentsController,
    LoanTypesController,
    AccountTypesController,
    TransactionsController,
    LedgerAccountsController,
    JournalsController,
  ],
  providers: [
    ApiAdminService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    LedgerAccountsService,
    JournalsService,
    {
      provide: 'LedgerAccountRepository',
      useClass: PrismaLedgerAccountRepository,
    },
    { provide: 'JournalRepository', useClass: PrismaJournalRepository },
  ],
})
export class ApiAdminModule {}
