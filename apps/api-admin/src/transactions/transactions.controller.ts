import {
  AccessTokenGuard,
  PaginatedResponseDto,
  PaginationQueryDto,
  TransactionsService,
} from '@app/application';
import { CreateTransactionInput, TransactionKind } from '@app/domain';
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
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateTransactionDto } from './dtos/transactions/create-transaction.dto';
import { UpdateTransactionDto } from './dtos/transactions/update-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(AccessTokenGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.transactionsService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/transactions?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID with images' })
  @ApiResponse({ status: 200, description: 'Returns transaction with images' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @UsePipes(UUID_V4_PIPE)
  async get(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.transactionsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateTransactionDto) {
    const input: CreateTransactionInput = {
      userId: dto.userId,
      kind: dto.kind as TransactionKind,
      amount: dto.amount,
      externalRef: dto.externalRef || null,
      note: dto.note || null,
      status: 'PENDING',
    };
    return await this.transactionsService.create(input);
  }

  @Post('/approve/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction approved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async approve(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.transactionsService.approve(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @UsePipes(UUID_V4_PIPE)
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiResponse({ status: 204, description: 'Transaction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @UsePipes(UUID_V4_PIPE)
  async remove(@Param('id', UUID_V4_PIPE) id: string) {
    await this.transactionsService.delete(id);
    return;
  }
}
