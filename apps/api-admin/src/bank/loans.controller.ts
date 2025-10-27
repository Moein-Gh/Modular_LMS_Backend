import {
  AccessTokenGuard,
  LoansService,
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
import { CreateLoanDto } from './dtos/loans/create-loan.dto';
import { UpdateLoanDto } from './dtos/loans/update-loan.dto';

@Controller('loans')
@UseGuards(AccessTokenGuard)
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.loans.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/loans?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.loans.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLoanDto) {
    return this.loans.create(dto);
  }

  @Patch(':id')
  update(@Param('id', UUID_V4_PIPE) id: string, @Body() dto: UpdateLoanDto) {
    return this.loans.update(id, dto);
  }

  @Post('/approve/:id')
  approve(@Param('id', UUID_V4_PIPE) id: string) {
    return this.loans.approve(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_V4_PIPE) id: string) {
    await this.loans.delete(id);
    return;
  }
}
