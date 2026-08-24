import {
  JournalsService,
  PaginatedResponseDto,
  Permissions,
} from '@app/application';
import { AddSingleJournalEntryDto } from '@app/application/ledger/dto/add-single-journal-entry.dto';
import { GetJournalQueryDto } from '@app/application/ledger/dto/get-journal-query.dto';
import { GetJournalsQueryDto } from '@app/application/ledger/dto/get-journals-query.dto';
import { Journal } from '@app/domain';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('Journals')
@Controller()
export class JournalsController {
  constructor(private readonly service: JournalsService) {}

  @Post('admin/journals')
  @ApiOperation({
    summary: 'Add a single journal entry to an existing journal',
    description:
      'Add one journal entry at a time to a PENDING journal without balance validation. Allows building journal entries incrementally for account balance adjustments, subscription fees, loan repayments, and commission charges.',
  })
  async create(@Body() dto: AddSingleJournalEntryDto): Promise<Journal> {
    return this.service.create(dto);
  }

  @Get('admin/journals')
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
        `/admin/journals?page=${p}&pageSize=${s}${query.includeEntries ? '&includeEntries=true' : ''}`,
    });
  }

  @Get('admin/journals/:id')
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

  @Permissions('user/journal/findAll')
  @Get('user/journals')
  @ApiOperation({ summary: 'Get all journals with optional entries' })
  @ApiQuery({
    name: 'includeEntries',
    required: false,
    type: Boolean,
    description: 'Include journal entries in the response',
  })
  async findAllForUser(
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
        `/user/journals?page=${p}&pageSize=${s}${query.includeEntries ? '&includeEntries=true' : ''}`,
    });
  }

  @Permissions('user/journal/findById')
  @Get('user/journals/:id')
  @ApiOperation({ summary: 'Get journal by ID with optional entries' })
  @ApiQuery({
    name: 'includeEntries',
    required: false,
    type: Boolean,
    description: 'Include journal entries in the response',
  })
  getForUser(
    @Param('id', UUID_V4_PIPE) id: string,
    @Query() query: GetJournalQueryDto,
  ) {
    return this.service.findOne(id, query.includeEntries);
  }
}
