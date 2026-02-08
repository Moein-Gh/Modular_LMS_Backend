import {
  CurrentUserId,
  LoansService,
  PaginatedResponseDto,
} from '@app/application';
import { Loan } from '@app/domain';
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { GetLoansQueryDto } from '../../../api-admin/src/bank/dtos/loans/list-loan.dto';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@Controller('loans')
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Get()
  async findAll(
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
      makeUrl: (p, s) => `/loans?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  async get(
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
