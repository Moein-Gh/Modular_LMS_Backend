import {
  CurrentUserId,
  FilesService,
  ImageUpload,
  PaginatedResponseDto,
  Permissions,
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
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from '../../../api-admin/src/transactions/dtos/transactions/create-transaction.dto';
import { GetTransactionsQueryDto } from '../../../api-admin/src/transactions/dtos/transactions/get-transaction.dto';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly filesService: FilesService,
    private readonly transactionImagesService: TransactionImagesService,
  ) {}

  @Permissions('user/transaction/findAll')
  @Get('/')
  @ApiOperation({ summary: 'Get all transactions with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  async findAll(
    @Query() query: GetTransactionsQueryDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<PaginatedResponseDto<Transaction>> {
    query.userId = currentUserId;
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
  @Permissions('user/transaction/findById')
  @ApiOperation({ summary: 'Get transaction by ID with images' })
  @ApiResponse({ status: 200, description: 'Returns transaction with images' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async get(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionsService.findById(id);
    if (currentUserId !== transaction.userId)
      throw new ForbiddenException('شما به این تراکنش دسترسی ندارید');
    return transaction;
  }

  @Permissions('user/transaction/create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ImageUpload()
  async create(
    @UploadedFile() image: Express.Multer.File | undefined,
    @Body() dto: CreateTransactionDto,
  ) {
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
}
