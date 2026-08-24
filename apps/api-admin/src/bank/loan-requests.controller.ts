import {
  CreateLoanRequestDto,
  CurrentUserId,
  LoanRequestsService,
  PaginatedResponseDto,
  ReviewLoanRequestDto,
  UpdateLoanRequestDto,
} from '@app/application';
import { LoanRequest, LoanRequestStatus } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
@Controller()
export class LoanRequestsController {
  constructor(private readonly loanRequestsService: LoanRequestsService) {}

  @Post('admin/loan-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan request' })
  async create(@Body() dto: CreateLoanRequestDto) {
    return await this.loanRequestsService.create({
      ...dto,
      startDate: new Date(dto.startDate),
    });
  }

  @Get('admin/loan-requests')
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
      makeUrl: (p, s) => `/admin/loan-requests?page=${p}&pageSize=${s}`,
    });
  }

  @Get('admin/loan-requests/:id')
  @ApiOperation({ summary: 'Get loan request by ID' })
  async findById(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.loanRequestsService.findById(id);
  }

  @Post('admin/loan-requests/:id/approve')
  @ApiOperation({ summary: 'Approve a loan request and create a loan' })
  async approve(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.loanRequestsService.approve(id);
  }

  @Post('admin/loan-requests/:id/reject')
  @ApiOperation({ summary: 'Reject a loan request' })
  async reject(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.loanRequestsService.reject(id);
  }

  @Patch('admin/loan-requests/:id/status')
  @ApiOperation({ summary: 'Update loan request status' })
  async updateStatus(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: ReviewLoanRequestDto,
  ) {
    return await this.loanRequestsService.updateStatus(id, dto.status);
  }

  @Patch('admin/loan-requests/:id')
  @ApiOperation({ summary: 'Update loan request note' })
  async update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateLoanRequestDto,
  ) {
    return await this.loanRequestsService.update(id, { note: dto.note });
  }

  @Delete('admin/loan-requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a loan request' })
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.loanRequestsService.softDelete(id, currentUserId);
  }

  @Post('admin/loan-requests/:id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore a soft-deleted loan request' })
  async restore(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.loanRequestsService.restore(id);
  }

  @Post('user/loan-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan request' })
  async createForUser(@Body() dto: CreateLoanRequestDto): Promise<LoanRequest> {
    return this.loanRequestsService.create({
      ...dto,
      startDate: new Date(dto.startDate),
    });
  }

  @Get('user/loan-requests')
  @ApiOperation({ summary: 'Get user loan requests with pagination' })
  async findAllForUser(
    @Query() query: GetLoanRequestsQueryDto,
    @CurrentUserId() userId: string,
    @Query('accountId') accountId?: string,
    @Query('status') status?: LoanRequestStatus,
  ): Promise<PaginatedResponseDto<LoanRequest>> {
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
      makeUrl: (p, s) => `/user/loan-requests?page=${p}&pageSize=${s}`,
    });
  }

  @Get('user/loan-requests/:id')
  @ApiOperation({ summary: 'Get loan request by ID' })
  async findByIdForUser(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() userId: string,
  ): Promise<LoanRequest> {
    const loanRequest = await this.loanRequestsService.findById(id);
    // Ensure user can only access their own requests
    if (loanRequest.userId !== userId) {
      throw new ForbiddenException('Unauthorized access');
    }
    return loanRequest;
  }
}
