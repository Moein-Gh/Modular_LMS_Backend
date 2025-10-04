import { CreateJournalDto, JournalsService } from '@app/application';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Journals')
@Controller('journals')
export class JournalsController {
  constructor(private readonly service: JournalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create journal with entries' })
  create(@Body() dto: CreateJournalDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List journals' })
  list() {
    return this.service.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal with entries' })
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete journal' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
