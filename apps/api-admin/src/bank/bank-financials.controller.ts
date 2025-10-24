import { AccessTokenGuard, BankFinancialsService } from '@app/application';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BalanceResponseDto } from './dtos/balance-response.dto';
import { BankFinancialSummaryDto } from './dtos/bank-financial-summary.dto';

@ApiTags('Bank Financials')
@Controller('bank/financials')
@UseGuards(AccessTokenGuard)
export class BankFinancialsController {
  constructor(private readonly financialsService: BankFinancialsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get bank financial summary',
    description:
      'Returns comprehensive financial metrics including cash, deposits, loans, and equity',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
    type: BankFinancialSummaryDto,
  })
  async getSummary(): Promise<BankFinancialSummaryDto> {
    return this.financialsService.getFinancialSummary();
  }

  @Get('cash')
  @ApiOperation({
    summary: 'Get current cash balance',
    description: 'Returns the balance of the Cash account (1000)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cash balance retrieved successfully',
    type: BalanceResponseDto,
  })
  async getCash(): Promise<BalanceResponseDto> {
    const balance = await this.financialsService.getCashBalance();
    return { balance };
  }

  @Get('deposits')
  @ApiOperation({
    summary: 'Get customer deposits balance',
    description: 'Returns the balance of the Customer Deposits account (2000)',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer deposits balance retrieved successfully',
    type: BalanceResponseDto,
  })
  async getDeposits(): Promise<BalanceResponseDto> {
    const balance = await this.financialsService.getCustomerDepositsBalance();
    return { balance };
  }

  @Get('loans-receivable')
  @ApiOperation({
    summary: 'Get loans receivable balance',
    description: 'Returns the balance of the Loans Receivable account (1100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Loans receivable balance retrieved successfully',
    type: BalanceResponseDto,
  })
  async getLoansReceivable(): Promise<BalanceResponseDto> {
    const balance = await this.financialsService.getLoansReceivableBalance();
    return { balance };
  }

  @Get('available-for-lending')
  @ApiOperation({
    summary: 'Get available cash for lending',
    description:
      'Returns the amount of cash available for new loans (Cash - Customer Deposits)',
  })
  @ApiResponse({
    status: 200,
    description: 'Available lending capacity retrieved successfully',
    type: BalanceResponseDto,
  })
  async getAvailableForLending(): Promise<BalanceResponseDto> {
    const balance = await this.financialsService.getAvailableForLending();
    return { balance };
  }

  @Get('income')
  @ApiOperation({
    summary: 'Get total income earned',
    description:
      'Returns the balance of the Fee/Commission Income account (4100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Total income retrieved successfully',
    type: BalanceResponseDto,
  })
  async getIncome(): Promise<BalanceResponseDto> {
    const balance = await this.financialsService.getTotalIncomeEarned();
    return { balance };
  }
}
