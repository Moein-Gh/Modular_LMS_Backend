import { Module } from '@nestjs/common';
import { ApiAdminController } from './api-admin.controller';
import { ApiAdminService } from './api-admin.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';

@Module({
  imports: [PrismaService],
  controllers: [ApiAdminController],
  providers: [ApiAdminService],
})
export class ApiAdminModule {}
