import {
  AddToQueueDto,
  CurrentUserId,
  LoanQueueService,
  UpdateQueueItemDto,
  UpdateQueueOrderDto,
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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('Loan Queue')
@Controller('loan-queue')
export class LoanQueueController {
  constructor(private readonly loanQueueService: LoanQueueService) {}

  @Get()
  @ApiOperation({ summary: 'Get loan queue ordered by queue position' })
  async getQueue() {
    return await this.loanQueueService.getQueue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan queue item by ID' })
  async findById(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.loanQueueService.findById(id);
  }

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add loan request to evaluation queue' })
  async addToQueue(@Body() dto: AddToQueueDto) {
    return await this.loanQueueService.addToQueue({
      loanRequestId: dto.loanRequestId,
      queueOrder: dto.queueOrder,
      adminNotes: dto.adminNotes,
    });
  }

  @Delete('remove/:loanRequestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove loan request from queue by loan request ID',
  })
  async removeFromQueue(
    @Param('loanRequestId', UUID_V4_PIPE) loanRequestId: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.loanQueueService.removeFromQueue(loanRequestId, currentUserId);
  }

  @Patch(':id/order')
  @ApiOperation({ summary: 'Update queue item order position' })
  async updateOrder(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateQueueOrderDto,
  ) {
    return await this.loanQueueService.updateOrder(id, dto.newOrder);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update queue item admin notes' })
  async updateQueueItem(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateQueueItemDto,
  ) {
    return await this.loanQueueService.updateQueueItem(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a loan queue item' })
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.loanQueueService.softDelete(id, currentUserId);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restore a soft-deleted loan queue item' })
  async restore(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.loanQueueService.restore(id);
  }
}
