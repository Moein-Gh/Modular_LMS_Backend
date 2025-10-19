import {
  JournalsService,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@app/application';
import { Journal } from '@app/domain';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Journal>> {
    const { items, totalItems, page, pageSize } =
      await this.service.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/journals?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal with entries' })
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.service.findOne(id);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete journal' })
  // remove(@Param('id') id: string) {
  //   return this.service.remove(id);
  // }
}
