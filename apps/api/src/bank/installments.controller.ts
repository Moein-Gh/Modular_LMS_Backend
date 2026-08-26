import {
  CurrentUserId,
  InstallmentsService,
  PaginatedResponseDto,
} from '@app/application';
import { Installment } from '@app/domain';
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
import { CreateInstallmentDto } from './dtos/installments/create-installment.dto';
import { GetInstallmentsQueryDto } from './dtos/installments/list-installment.dto';
import { UpdateInstallmentDto } from './dtos/installments/update-installment.dto';

@Controller()
export class InstallmentsController {
  constructor(private readonly installments: InstallmentsService) {}

  @Get('admin/installments')
  async findAll(
    @Query() query: GetInstallmentsQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.installments.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/admin/installments?page=${p}&pageSize=${s}`,
    });
  }

  @Get('admin/installments/:id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.installments.findById(id);
  }

  @Post('admin/installments')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInstallmentDto) {
    return this.installments.create(dto);
  }

  @Patch('admin/installments/:id')
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateInstallmentDto,
  ) {
    return this.installments.update(id, dto);
  }

  @Delete('admin/installments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.installments.softDelete(id, currentUserId);
    return;
  }

  @Get('user/installments')
  async findAllForUser(
    @Query() query: GetInstallmentsQueryDto,
  ): Promise<PaginatedResponseDto<Installment>> {
    const { items, totalItems, page, pageSize } =
      await this.installments.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/user/installments?page=${p}&pageSize=${s}`,
    });
  }

  @Get('user/installments/:id')
  getForUser(@Param('id', UUID_V4_PIPE) id: string): Promise<Installment> {
    return this.installments.findById(id);
  }
}
