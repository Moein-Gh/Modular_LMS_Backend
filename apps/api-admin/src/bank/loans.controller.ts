import {
  CurrentUserId,
  LoansService,
  PaginatedResponseDto,
} from '@app/application';
import { Loan } from '@app/domain';
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
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateLoanDto } from './dtos/loans/create-loan.dto';
import { GetLoansQueryDto } from './dtos/loans/list-loan.dto';
import { UpdateLoanDto } from './dtos/loans/update-loan.dto';

@Controller()
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Get('admin/loans')
  async findAll(
    @Query() query: GetLoansQueryDto,
  ): Promise<PaginatedResponseDto<Loan>> {
    const { items, totalItems, page, pageSize } =
      await this.loans.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/admin/loans?page=${p}&pageSize=${s}`,
    });
  }

  @Get('admin/loans/:id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.loans.findById(id);
  }

  @Post('admin/loans')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLoanDto) {
    return this.loans.create(dto);
  }

  @Patch('admin/loans/:id')
  update(@Param('id', UUID_V4_PIPE) id: string, @Body() dto: UpdateLoanDto) {
    return this.loans.update(id, dto);
  }

  @Post('admin/loans/approve/:id')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id', UUID_V4_PIPE) id: string) {
    return await this.loans.approve(id);
  }

  @Delete('admin/loans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ) {
    await this.loans.softDelete(id, currentUserId);
    return;
  }

  @Get('user/loans')
  async findAllForUser(
    @Query() query: GetLoansQueryDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<PaginatedResponseDto<Loan>> {
    query.userId = currentUserId;
    const { items, totalItems, page, pageSize } =
      await this.loans.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/user/loans?page=${p}&pageSize=${s}`,
    });
  }

  @Get('user/loans/:id')
  async getForUser(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<Loan> {
    const loan = await this.loans.findById(id);
    if (loan.userId !== currentUserId) {
      throw new ForbiddenException('شما به این وام دسترسی ندارید');
    }
    return loan;
  }
}
