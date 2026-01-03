import {
  AccountTypesService,
  CurrentUserId,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@app/application';
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
} from '@nestjs/common';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';
import { CreateAccountTypeDto } from './dtos/account-types/create-account-type.dto';
import { UpdateAccountTypeDto } from './dtos/account-types/update-account-type.dto';

@Controller('account-types')
export class AccountTypesController {
  constructor(private readonly accountTypes: AccountTypesService) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { items, totalItems, page, pageSize } =
      await this.accountTypes.findAll(query);
    return PaginatedResponseDto.from({
      items,
      totalItems,
      page,
      pageSize,
      makeUrl: (p, s) => `/account-types?page=${p}&pageSize=${s}`,
    });
  }

  @Get(':id')
  get(@Param('id', UUID_V4_PIPE) id: string) {
    return this.accountTypes.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAccountTypeDto) {
    return this.accountTypes.create({
      name: dto.name,
      maxAccounts: dto.maxAccounts,
    });
  }

  @Patch(':id')
  update(
    @Param('id', UUID_V4_PIPE) id: string,
    @Body() dto: UpdateAccountTypeDto,
  ) {
    return this.accountTypes.update(id, {
      name: dto.name,
      maxAccounts: dto.maxAccounts,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', UUID_V4_PIPE) id: string,
    @CurrentUserId() currentUserId: string,
  ) {
    await this.accountTypes.softDelete(id, currentUserId);
    return;
  }
}
