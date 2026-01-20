import {
  AuthApplicationModule,
  BankApplicationModule,
  JournalsService,
  LedgerAccountsService,
} from '@app/application';
import { UserApplicationModule } from '@app/application/user/user-application.module';
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
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';
import { DeviceController } from './auth/device.controller';
import { LoanRequestsController } from './loan-requests.controller';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    AuthApplicationModule,
    UserApplicationModule,
    BankApplicationModule,
  ],
  controllers: [ApiUserController, DeviceController, LoanRequestsController],
  providers: [
    ApiUserService,
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
