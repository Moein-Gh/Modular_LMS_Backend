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

  // @Get(':id')
  // @ApiOperation({ summary: 'Get ledger account' })
  // findOne(@Param('id') id: string) {
  //   return this.service.findOne(id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update ledger account' })
  // update(@Param('id') id: string, @Body() dto: UpdateLedgerAccountDto) {
  //   return this.service.update(id, dto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete ledger account' })
  // remove(@Param('id') id: string) {
  //   return this.service.remove(id);
  // }
}
