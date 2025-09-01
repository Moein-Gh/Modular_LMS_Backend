import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAccountTypeRepository } from './repositories/prisma-account-type.repository';
import { PrismaAccountRepository } from './repositories/prisma-account.repository';

@Module({
  imports: [PrismaModule],
  providers: [PrismaAccountRepository, PrismaAccountTypeRepository],
  exports: [PrismaAccountRepository, PrismaAccountTypeRepository],
})
export class BankInfraModule {}
