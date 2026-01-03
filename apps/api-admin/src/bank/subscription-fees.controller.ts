import {
  CurrentUserId,
  PaginatedResponseDto,
  SubscriptionFeesService,
} from '@app/application';
import { SubscriptionFee } from '@app/domain';
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
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateSubscriptionFeeDto } from './dtos/subscription-fees/create-subscription-fee.dto';
import { GetSubscriptionFeesQueryDto } from './dtos/subscription-fees/list-subscription-fee.dto';
import { UpdateSubscriptionFeeDto } from './dtos/subscription-fees/update-subscription-fee.dto';

@Controller('subscription-fees')
export class SubscriptionFeesController {
  constructor(private readonly subscriptionFees: SubscriptionFeesService) {}

  @Get()
  async findAll(
    @Query() query: GetSubscriptionFeesQueryDto,
  ): Promise<PaginatedResponseDto<SubscriptionFee>> {
    const { items, totalItems, page, pageSize } =
      await this.subscriptionFees.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/subscription-fees?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.subscriptionFees.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSubscriptionFeeDto) {
    return this.subscriptionFees.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateSubscriptionFeeDto,
  ) {
    return this.subscriptionFees.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ) {
    await this.subscriptionFees.softDelete(id, currentUserId);
    return;
  }
}
