import { LedgerInfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { ReportService } from './report.service';

@Module({
  imports: [LedgerInfraModule],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportApplicationModule {}
