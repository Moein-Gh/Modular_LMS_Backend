import { CreateLoanRequestDto, LoanRequestsService } from '@app/application';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Loan Requests')
@Controller('loan-requests')
export class LoanRequestsController {
  constructor(private readonly loanRequestsService: LoanRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan request' })
  async create(@Body() dto: CreateLoanRequestDto) {
    return this.loanRequestsService.create({
      ...dto,
      startDate: new Date(dto.startDate),
    });
  }
}
