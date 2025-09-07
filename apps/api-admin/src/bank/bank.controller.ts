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
import { AccessTokenGuard } from '@app/application';
import { AccountTypesService } from '@app/application';
import { BankService } from '@app/application';
import { CreateBankDto } from './dtos/create-bank.dto';
import { CreateAccountTypeDto } from './dtos/account-types/create-account-type.dto';
import { UpdateAccountTypeDto } from './dtos/account-types/update-account-type.dto';
// controller shouldn't depend on domain types for simple DTO forwarding

@Controller('bank')
export class BankController {
  constructor(
    private readonly accountTypes: AccountTypesService,
    private readonly bankService: BankService,
  ) {}

  // Account Types
  @UseGuards(AccessTokenGuard)
  @Post('account-types')
  @HttpCode(HttpStatus.CREATED)
  createAccountType(@Body() dto: CreateAccountTypeDto) {
    return this.accountTypes.create({ name: dto.name });
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createBank(@Body() dto: CreateBankDto) {
    // Delegate creation and validation to application service; it will
    // throw a BankAlreadyExistsError if a bank is already present.
    return this.bankService.bootstrap(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('account-types/:id')
  updateAccountType(
    @Param('id') id: string,
    @Body() dto: UpdateAccountTypeDto,
  ) {
    return this.accountTypes.update(id, { name: dto.name });
  }

  @UseGuards(AccessTokenGuard)
  @Get('account-types/:id')
  getAccountType(@Param('id') id: string) {
    return this.accountTypes.findById(id);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('account-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccountType(@Param('id') id: string) {
    await this.accountTypes.delete(id);
    return;
  }
}
