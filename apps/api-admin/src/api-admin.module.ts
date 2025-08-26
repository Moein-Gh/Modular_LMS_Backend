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
import { AuthService, UsersService } from '@app/application';
import { ConfigModule } from '@app/config';
import { AccessModule } from './access/access.module';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    AccessModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    UserInfraModule,
    ConfigModule,
  ],
  controllers: [ApiAdminController, UsersController, AuthController],
  providers: [
    ApiAdminService,
    AuthService,
    UsersService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class ApiAdminModule {}
