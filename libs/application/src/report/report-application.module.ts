import { DateModule } from '@app/date';
import {
  BankInfraModule,
  LedgerInfraModule,
  TransactionInfraModule,
  UserInfraModule,
} from '@app/infra';
import { Module } from '@nestjs/common';
import { ReportService } from './report.service';

@Module({
  imports: [
    LedgerInfraModule,
    BankInfraModule,
    UserInfraModule,
    TransactionInfraModule,
    DateModule,
  ],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportApplicationModule {}
