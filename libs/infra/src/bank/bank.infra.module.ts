import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaAccountTypeRepository } from './repositories/prisma-account-type.repository';
import { PrismaAccountRepository } from './repositories/prisma-account.repository';
import { PrismaBankRepository } from './repositories/prisma-bank.repository';
import { PrismaInstallmentRepository } from './repositories/prisma-installment.repository';
import { PrismaLoanQueueRepository } from './repositories/prisma-loan-queue.repository';
import { PrismaLoanRequestRepository } from './repositories/prisma-loan-request.repository';
import { PrismaLoanTypeRepository } from './repositories/prisma-loan-type.repository';
import { PrismaLoanRepository } from './repositories/prisma-loan.repository';
import { PrismaSubscriptionFeeRepository } from './repositories/prisma-subscription-fee.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaAccountRepository,
    PrismaAccountTypeRepository,
    PrismaBankRepository,
    PrismaLoanTypeRepository,
    PrismaLoanRepository,
    PrismaLoanRequestRepository,
    PrismaLoanQueueRepository,
    PrismaInstallmentRepository,
    PrismaSubscriptionFeeRepository,
  ],
  exports: [
    PrismaAccountRepository,
    PrismaAccountTypeRepository,
    PrismaBankRepository,
    PrismaLoanTypeRepository,
    PrismaLoanRepository,
    PrismaLoanRequestRepository,
    PrismaLoanQueueRepository,
    PrismaInstallmentRepository,
    PrismaSubscriptionFeeRepository,
  ],
})
export class BankInfraModule {}
