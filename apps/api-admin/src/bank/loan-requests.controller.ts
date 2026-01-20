import {
  CurrentUserId,
  LoanRequestsService,
  PaginatedResponseDto,
  ReviewLoanRequestDto,
} from '@app/application';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { GetLoanRequestsQueryDto } from './dtos/loan-requests/get-loan-requests-query.dto';

@ApiTags('Loan Requests')
@Controller('loan-requests')
export class LoanRequestsController {
  constructor(private readonly loanRequestsService: LoanRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all loan requests with pagination' })
  async findAll(
    @Query() query: GetLoanRequestsQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.loanRequestsService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/loan-requests?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan request by ID' })
  async findById(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.loanRequestsService.findById(id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Approve or reject a loan request' })
  async review(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: ReviewLoanRequestDto,
  ) {
    return await this.loanRequestsService.updateStatus(id, dto.status);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update loan request status' })
  async updateStatus(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: ReviewLoanRequestDto,
  ) {
    return await this.loanRequestsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a loan request' })
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.loanRequestsService.softDelete(id, currentUserId);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore a soft-deleted loan request' })
  async restore(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.loanRequestsService.restore(id);
  }
}
