import {
  AccessTokenGuard,
  InstallmentsService,
  PaginatedResponseDto,
  PaginationQueryDto,
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
  UseGuards,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateInstallmentDto } from './dtos/installments/create-installment.dto';
import { UpdateInstallmentDto } from './dtos/installments/update-installment.dto';

@Controller('installments')
@UseGuards(AccessTokenGuard)
export class InstallmentsController {
  constructor(private readonly installments: InstallmentsService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.installments.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/installments?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.installments.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInstallmentDto) {
    return this.installments.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateInstallmentDto,
  ) {
    return this.installments.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_V4_PIPE) id: string) {
    await this.installments.delete(id);
    return;
  }
}
