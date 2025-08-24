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
import { CreateUserUseCase } from '@app/application';
import { AccessModule } from './access/access.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    AccessModule,
    ProblemDetailsModule,
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    UserInfraModule,
  ],
  controllers: [ApiAdminController, UsersController],
  providers: [
    ApiAdminService,
    CreateUserUseCase,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class ApiAdminModule {}
