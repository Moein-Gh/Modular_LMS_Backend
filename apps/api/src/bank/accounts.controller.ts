import {
  AccountsService,
  CurrentUserId,
  PaginatedResponseDto,
  Permissions,
} from '@app/application';
import { Account } from '@app/domain';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateAccountDto } from './dtos/accounts/create-account.dto';
import { GetAccountsQueryDto } from './dtos/accounts/get-accounts-query.dto';
import { UpdateAccountDto } from './dtos/accounts/update-account.dto';

@Controller()
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get('admin/accounts')
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
      makeUrl: (p, s) => `/admin/accounts?page=${p}&pageSize=${s}`,
    });
  }

  @Get('admin/accounts/:id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.accounts.findById(id);
  }

  @Post('admin/accounts')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAccountDto) {
    return this.accounts.create(dto);
  }

  @Post('admin/accounts/:id/buy-out')
  @HttpCode(HttpStatus.OK)
  async buyOut(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<Account> {
    await this.accounts.buyOut(id, currentUserId);
    return this.accounts.findById(id);
  }

  @Patch('admin/accounts/:id')
  update(@Param('id', UUID_V4_PIPE) id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(id, dto);
  }

  @Delete('admin/accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ): Promise<void> {
    await this.accounts.softDelete(id, currentUserId);
    return;
  }

  @Patch('admin/accounts/:id/activate')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id', UUID_V4_PIPE) id: string): Promise<Account> {
    return this.accounts.activate(id);
  }

  @Permissions('user/account/findAll')
  @Get('user/accounts')
  async findAllForUser(
    @Query() query: GetAccountsQueryDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<PaginatedResponseDto<Account>> {
    query.userId = currentUserId;
    const { items, totalItems, page, pageSize } =
      await this.accounts.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/user/accounts?page=${p}&pageSize=${s}`,
    });
  }

  @Permissions('user/account/findById')
  @Get('user/accounts/:id')
  async getForUser(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ) {
    const account = await this.accounts.findById(id);
    if (account.userId !== currentUserId) {
      throw new ForbiddenException('شما به این حساب دسترسی ندارید');
    }
    return account;
  }
}
