import { Module } from '@nestjs/common';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { LoggerModule } from '@app/logger';
import { ProblemDetailsModule } from '@app/problem-details';

@Module({
  imports: [PrismaService, LoggerModule, ProblemDetailsModule],
  controllers: [ApiAdminController],
  providers: [ApiAdminService],
})
export class ApiAdminModule {}
