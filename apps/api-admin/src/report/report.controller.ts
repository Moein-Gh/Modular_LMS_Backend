import { ReportService } from '@app/application';
import { Controller, Get } from '@nestjs/common';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/dashboard/summary')
  getDashboardSummary() {
    return this.reportService.getFinancialSummary();
  }
}
