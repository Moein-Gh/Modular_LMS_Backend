import {
  AccountsService,
  CurrentUserId,
  PaginatedResponseDto,
  Permissions,
} from '@app/application';
import { Account } from '@app/domain';
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { GetAccountsQueryDto } from '../../../api-admin/src/bank/dtos/accounts/get-accounts-query.dto';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Permissions('user/account/findAll')
  @Get()
  async findAll(
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
      makeUrl: (p, s) => `/accounts?page=${p}&pageSize=${s}`,
    });
  }

  @Permissions('user/account/findById')
  @Get(':id')
  async get(
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
