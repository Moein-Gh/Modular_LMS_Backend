import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAccountTypeRepository } from './repositories/prisma-account-type.repository';
import { PrismaBankRepository } from './repositories/prisma-bank.repository';
import { PrismaAccountRepository } from './repositories/prisma-account.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaAccountRepository,
    PrismaAccountTypeRepository,
    PrismaBankRepository,
  ],
  exports: [
    PrismaAccountRepository,
    PrismaAccountTypeRepository,
    PrismaBankRepository,
  ],
})
export class BankInfraModule {}
