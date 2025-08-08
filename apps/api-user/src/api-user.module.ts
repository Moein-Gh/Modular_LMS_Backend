import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { ProblemDetailsModule } from '@app/problem-details';
import { LoggerModule } from '@app/logger';

@Module({
  imports: [PrismaService, ProblemDetailsModule, LoggerModule],
  controllers: [ApiUserController],
  providers: [ApiUserService],
})
export class ApiUserModule {}
