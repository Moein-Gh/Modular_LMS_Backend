import { AccountsService, PaginatedResponseDto } from '@app/application';
import { Account, AccountStatus } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateAccountDto } from './dtos/accounts/create-account.dto';
import { GetAccountsQueryDto } from './dtos/accounts/get-accounts-query.dto';
import { UpdateAccountDto } from './dtos/accounts/update-account.dto';

@Controller('accounts')
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

  @Post(':id/buy-out')
  @HttpCode(HttpStatus.OK)
  async buyOut(@Param('id', UUID_V4_PIPE) id: string): Promise<Account> {
    await this.accounts.buyOut(id);
    return this.accounts.findById(id);
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

  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', UUID_V4_PIPE) id: string): Promise<Account> {
    const updatedAccount = await this.accounts.update(id, {
      status: AccountStatus.ACTIVE,
    });

    if (!updatedAccount) {
      throw new NotFoundException('Account not found');
    }

    return updatedAccount;
  }
}
