import { Module } from '@nestjs/common';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { ProblemDetailsModule } from '@app/problem-details';

@Module({
  imports: [PrismaService, ProblemDetailsModule],
  controllers: [ApiAdminController],
  providers: [ApiAdminService],
})
export class ApiAdminModule {}
