import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAccountTypeRepository } from './repositories/prisma-account-type.repository';
import { PrismaAccountRepository } from './repositories/prisma-account.repository';
import { PrismaBankRepository } from './repositories/prisma-bank.repository';
import { PrismaLoanTypeRepository } from './repositories/prisma-loan-type.repository';
import { PrismaLoanRepository } from './repositories/prisma-loan.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaAccountRepository,
    PrismaAccountTypeRepository,
    PrismaBankRepository,
    PrismaLoanTypeRepository,
    PrismaLoanRepository,
  ],
  exports: [
    PrismaAccountRepository,
    PrismaAccountTypeRepository,
    PrismaBankRepository,
    PrismaLoanTypeRepository,
    PrismaLoanRepository,
  ],
})
export class BankInfraModule {}
