import {
  CreateLedgerAccountDto,
  LedgerAccountsService,
  UpdateLedgerAccountDto,
} from '@app/application';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('LedgerAccounts')
@Controller('ledger-accounts')
export class LedgerAccountsController {
  constructor(private readonly service: LedgerAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create ledger account' })
  create(@Body() dto: CreateLedgerAccountDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List ledger accounts' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ledger account' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ledger account' })
  update(@Param('id') id: string, @Body() dto: UpdateLedgerAccountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ledger account' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
