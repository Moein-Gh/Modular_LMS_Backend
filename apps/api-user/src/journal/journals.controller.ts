import {
  JournalsService,
  PaginatedResponseDto,
  Permissions,
} from '@app/application';
import { GetJournalQueryDto } from '@app/application/ledger/dto/get-journal-query.dto';
import { GetJournalsQueryDto } from '@app/application/ledger/dto/get-journals-query.dto';
import { Journal } from '@app/domain';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('Journals')
@Controller('journals')
export class JournalsController {
  constructor(private readonly service: JournalsService) {}

  @Permissions('user/journal/findAll')
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

  @Permissions('user/journal/findById')
  @Get(':id')
  @ApiOperation({ summary: 'Get journal by ID with optional entries' })
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
}
