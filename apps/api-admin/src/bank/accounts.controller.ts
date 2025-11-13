import {
  AccessTokenGuard,
  AccountsService,
  PaginatedResponseDto,
} from '@app/application';
import { Account } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateAccountDto } from './dtos/accounts/create-account.dto';
import { GetAccountsQueryDto } from './dtos/accounts/get-accounts-query.dto';
import { UpdateAccountDto } from './dtos/accounts/update-account.dto';

@Controller('accounts')
@UseGuards(AccessTokenGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  async findAll(
    @Query() query: GetAccountsQueryDto,
  ): Promise<PaginatedResponseDto<Account>> {
    const { items, totalItems, page, pageSize } =
      await this.accounts.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/accounts?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.accounts.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAccountDto) {
    return this.accounts.create(dto);
  }

  @Patch(':id')
  update(@Param('id', UUID_V4_PIPE) id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_V4_PIPE) id: string) {
    await this.accounts.delete(id);
    return;
  }
}
