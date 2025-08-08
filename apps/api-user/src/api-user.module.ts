import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { LoggerModule } from '@app/logger';
import { ProblemDetailsModule } from '@app/problem-details';

@Module({
  imports: [PrismaService, LoggerModule, ProblemDetailsModule],
  controllers: [ApiUserController],
  providers: [ApiUserService],
})
export class ApiUserModule {}
