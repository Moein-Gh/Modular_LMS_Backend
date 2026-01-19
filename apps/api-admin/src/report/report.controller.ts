import { PaginationQueryDto, ReportService } from '@app/application';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InstallmentProjectionsResponseDto } from './dtos/installment-projection-response.dto';

@ApiTags('Reports')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('/dashboard/summary')
  getDashboardSummary() {
    return this.reportService.getFinancialSummary();
  }

  @Get('/dashboard/entities')
  getDashboardEntitiesSummary() {
    return this.reportService.getEntitesSummary();
  }

  @Get('/projections/installments')
  @ApiOperation({
    summary: 'Get installment projections',
    description:
      'Returns detailed installment projections for current month, next month, and next 3 months with full loan and user information',
  })
  @ApiResponse({
    status: 200,
    description: 'Installment projections retrieved successfully',
    type: InstallmentProjectionsResponseDto,
  })
  getInstallmentProjections(@Query() query: PaginationQueryDto) {
    return this.reportService.getInstallmentProjections(query);
  }
}
