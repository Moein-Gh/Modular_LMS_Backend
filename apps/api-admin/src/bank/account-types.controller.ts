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
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard, AccountTypesService } from '@app/application';
import { CreateAccountTypeDto } from './dtos/account-types/create-account-type.dto';
import { UpdateAccountTypeDto } from './dtos/account-types/update-account-type.dto';

@Controller('account-types')
@UseGuards(AccessTokenGuard)
export class AccountTypesController {
  constructor(private readonly accountTypes: AccountTypesService) {}

  @Get()
  list() {
    return this.accountTypes.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.accountTypes.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAccountTypeDto) {
    return this.accountTypes.create({ name: dto.name });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountTypeDto) {
    return this.accountTypes.update(id, { name: dto.name });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.accountTypes.delete(id);
    return;
  }
}
