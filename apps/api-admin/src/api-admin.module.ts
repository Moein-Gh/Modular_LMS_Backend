import { Module } from '@nestjs/common';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { PrismaModule } from '@app/infra/prisma/prisma.module';
import { LoggerModule } from '@app/logger';
import { ProblemDetailsModule } from '@app/problem-details';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersController } from './users/users.controller';
import { UserInfraModule } from '@app/infra';
import { AuthApplicationModule } from '@app/application';
import { UserApplicationModule } from '@app/application/user/user-application.module';
import { ConfigModule } from '@app/config';
import { AccessModule } from './access/access.module';
import { AuthController } from './auth/auth.controller';
import { AccountsController } from './bank/accounts.controller';
import { AccountTypesController } from './bank/account-types.controller';
import { BankApplicationModule } from '@app/application';

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
    AccountTypesController,
  ],
  providers: [
    ApiAdminService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class ApiAdminModule {}
