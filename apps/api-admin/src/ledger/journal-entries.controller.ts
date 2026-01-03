import { PaginatedResponseDto } from '@app/application';
import { AddMultipleJournalEntriesDto } from '@app/application/ledger/dto/add-multiple-journal-entries.dto';
import { AddSingleJournalEntryDto } from '@app/application/ledger/dto/add-single-journal-entry.dto';
import { GetJournalEntriesQueryDto } from '@app/application/ledger/dto/get-journalEntries-query.dto';
import { JournalEntriesService } from '@app/application/ledger/journal-entries.service';
import { Journal, JournalEntry } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@ApiTags('JournalEntries')
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all journal entries' })
  async findAll(
    @Query() query: GetJournalEntriesQueryDto,
  ): Promise<PaginatedResponseDto<JournalEntry>> {
    const { items, totalItems, page, pageSize } =
      await this.journalEntriesService.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/journal-entries?page=${p}&pageSize=${s}`,
    });
  }

  @Post('/')
  @ApiOperation({
    summary: 'Add a single journal entry to an existing journal',
    description:
      'Add one journal entry at a time to a PENDING journal without balance validation. Allows building journal entries incrementally for account balance adjustments, subscription fees, loan repayments, and commission charges.',
  })
  async addSingleEntry(
    @Body() dto: AddSingleJournalEntryDto,
  ): Promise<Journal> {
    return this.journalEntriesService.addSingleEntry(dto);
  }

  @Post('/multiple')
  @ApiOperation({
    summary:
      'Add multiple journal entries of the same type to an existing journal',
    description:
      'Add multiple journal entries at once to a PENDING journal. Useful for bulk operations like allocating multiple installments, subscription fees, or account adjustments in a single transaction.',
  })
  async addMultipleEntries(
    @Body() dto: AddMultipleJournalEntriesDto,
  ): Promise<Journal> {
    return this.journalEntriesService.addMultipleEntries(dto);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a journal entry by ID' })
  async delete(@Param('id', UUID_V4_PIPE) id: string): Promise<void> {
    await this.journalEntriesService.delete(id);
  }
}
