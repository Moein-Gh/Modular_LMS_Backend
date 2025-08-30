import { Global, Module } from '@nestjs/common';
import { PrismaTransactionalRepository } from './prisma-transactional.repository';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, PrismaTransactionalRepository],
  exports: [PrismaService, PrismaTransactionalRepository],
})
export class PrismaModule {}
