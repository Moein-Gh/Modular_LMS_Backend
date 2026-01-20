import {
  CreateLoanRequestDto,
  CurrentUserId,
  LoanRequestsService,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@app/application';
import { LoanRequestStatus } from '@app/domain';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from './common/pipes/UUID.pipe';

@ApiTags('Loan Requests')
@Controller('loan-requests')
export class LoanRequestsController {
  constructor(private readonly loanRequestsService: LoanRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user loan requests with pagination' })
  async findAll(
    @Query() query: PaginationQueryDto,
    @CurrentUserId() userId: string,
    @Query('accountId') accountId?: string,
    @Query('status') status?: LoanRequestStatus,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.loanRequestsService.findAll({
        ...query,
        userId, // Filter to current user only
        accountId,
        status: status,
      });
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
  async findById(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() userId: string,
  ) {
    const loanRequest = await this.loanRequestsService.findById(id);
    // Ensure user can only access their own requests
    if (loanRequest.userId !== userId) {
      throw new Error('Unauthorized access');
    }
    return loanRequest;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan request' })
  async create(
    @Body() dto: CreateLoanRequestDto,
    @CurrentUserId() userId: string,
  ) {
    // Ensure userId in DTO matches current user
    return this.loanRequestsService.create({
      ...dto,
      userId,
      startDate: new Date(dto.startDate),
    });
  }
}
