import { Module } from '@nestjs/common';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { ProblemDetailsModule } from '@app/problem-details';
import { LoggerModule } from '@app/logger';

@Module({
  imports: [PrismaService, ProblemDetailsModule, LoggerModule],
  controllers: [ApiAdminController],
  providers: [ApiAdminService],
})
export class ApiAdminModule {}
