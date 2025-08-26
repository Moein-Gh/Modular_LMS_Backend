import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';
import { PrismaModule } from '@app/infra/prisma/prisma.module';
import { LoggerModule } from '@app/logger';
import { ProblemDetailsModule } from '@app/problem-details';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthApplicationModule } from '@app/application';
import { UserApplicationModule } from '@app/application/user/user-application.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    AuthApplicationModule,
    UserApplicationModule,
  ],
  controllers: [ApiUserController],
  providers: [ApiUserService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class ApiUserModule {}
