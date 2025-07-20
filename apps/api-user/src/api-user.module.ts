import { Module } from '@nestjs/common';
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';
import { PrismaService } from '@app/infra/prisma/prisma.module';

@Module({
  imports: [PrismaService],
  controllers: [ApiUserController],
  providers: [ApiUserService],
})
export class ApiUserModule {}
