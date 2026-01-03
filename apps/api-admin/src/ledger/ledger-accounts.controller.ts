import {
  LedgerAccountsService,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@app/application';
import { LedgerAccount } from '@app/domain';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('LedgerAccounts')
@Controller('ledger-accounts')
export class LedgerAccountsController {
  constructor(private readonly service: LedgerAccountsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create ledger account' })
  // create(@Body() dto: CreateLedgerAccountDto) {
  //   return this.service.create(dto);
  // }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<LedgerAccount>> {
    const { items, totalItems, page, pageSize } =
      await this.service.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/ledger-accounts?page=${p}&pageSize=${s}`,
    });
  }
}
