import { JournalsService, PaginatedResponseDto } from '@app/application';
import { GetJournalQueryDto } from '@app/application/ledger/dto/get-journal-query.dto';
import { GetJournalsQueryDto } from '@app/application/ledger/dto/get-journals-query.dto';
import { Journal } from '@app/domain';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
// import { Body, Delete, Post } from '@nestjs/common';
// import { CreateJournalDto } from '@app/application';

@ApiTags('Journals')
@Controller('journals')
export class JournalsController {
  constructor(private readonly service: JournalsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create journal with entries' })
  // create(@Body() dto: CreateJournalDto) {
  //   return this.service.create(dto);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all journals with optional entries' })
  @ApiQuery({
    name: 'includeEntries',
    required: false,
    type: Boolean,
    description: 'Include journal entries in the response',
  })
  async findAll(
    @Query() query: GetJournalsQueryDto,
  ): Promise<PaginatedResponseDto<Journal>> {
    const { items, totalItems, page, pageSize } =
      await this.service.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) =>
        `/journals?page=${p}&pageSize=${s}${query.includeEntries ? '&includeEntries=true' : ''}`,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal with optional entries' })
  @ApiQuery({
    name: 'includeEntries',
    required: false,
    type: Boolean,
    description: 'Include journal entries in the response',
  })
  get(
    @Param('id', UUID_V4_PIPE) id: string,
    @Query() query: GetJournalQueryDto,
  ) {
    return this.service.findOne(id, query.includeEntries);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete journal' })
  // remove(@Param('id') id: string) {
  //   return this.service.remove(id);
  // }
}
