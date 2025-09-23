import { AuthApplicationModule, BankApplicationModule } from '@app/application';
import { UserApplicationModule } from '@app/application/user/user-application.module';
import { ConfigModule } from '@app/config';
import { UserInfraModule } from '@app/infra';
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
import { LoanTypesController } from './bank/loan-types.controller';
import { LoansController } from './bank/loans.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    AccessModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    UserInfraModule,
    ConfigModule,
    AuthApplicationModule,
    UserApplicationModule,
    BankApplicationModule,
  ],
  controllers: [
    ApiAdminController,
    UsersController,
    AuthController,
    AccountsController,
    LoansController,
    LoanTypesController,
    AccountTypesController,
  ],
  providers: [
    ApiAdminService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class ApiAdminModule {}
