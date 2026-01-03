import {
  CurrentUserId,
  FilesService,
  ImageUpload,
  PaginatedResponseDto,
  TransactionImagesService,
  TransactionsService,
} from '@app/application';
import {
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
} from '@app/domain';
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
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateTransactionDto } from './dtos/transactions/create-transaction.dto';

import { CreateTransferTransactionDto } from './dtos/transactions/create-transfer-transaction.dto';
import { GetTransactionsQueryDto } from './dtos/transactions/get-transaction.dto';
import { UpdateTransactionDto } from './dtos/transactions/update-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly filesService: FilesService,
    private readonly transactionImagesService: TransactionImagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  async findAll(
    @Query() query: GetTransactionsQueryDto,
  ): Promise<PaginatedResponseDto<Transaction>> {
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
  async get(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.transactionsService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ImageUpload()
  async create(
    @UploadedFile() image: Express.Multer.File | undefined,
    @Body() dto: CreateTransactionDto,
  ) {
    // If image is present, upload via FilesService (which forwards to UploadThing)
    let fileRecord: import('@app/domain').File | null = null;
    if (image) {
      const payload = {
        buffer: image.buffer as unknown as Buffer,
        originalname: image.originalname,
        mimetype: image.mimetype,
        size: image.size,
      };
      const uploaded = await this.filesService.upload(payload);
      fileRecord = uploaded;
    }

    const input: CreateTransactionInput = {
      userId: dto.userId,
      kind: dto.kind,
      amount: typeof dto.amount === 'string' ? Number(dto.amount) : dto.amount,
      externalRef: dto.externalRef || null,
      note: dto.note || null,
      status: TransactionStatus.PENDING,
    } as unknown as CreateTransactionInput;

    const tx = await this.transactionsService.create(input);

    if (fileRecord) {
      await this.transactionImagesService.create(
        tx.id,
        fileRecord.id,
        dto.note ?? null,
      );
    }

    return tx;
  }

  @Post('/transfer')
  @HttpCode(HttpStatus.CREATED)
  async createTransfer(
    @CurrentUserId() userId: string | undefined,
    @Body() dto: CreateTransferTransactionDto,
  ) {
    const input = {
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      amount: typeof dto.amount === 'string' ? dto.amount : String(dto.amount),
      description: dto.description ?? null,
    };

    return await this.transactionsService.createTransferTransaction(
      input,
      userId,
    );
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
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.transactionsService.softDelete(id, currentUserId);
    return;
  }
}
