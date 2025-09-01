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
import { AccountsService } from '@app/application';
import { IsString } from 'class-validator';

class CreateAccountTypeDto {
  @IsString()
  name!: string;
}

class UpdateAccountTypeDto {
  @IsString()
  name!: string;
}

@Controller('bank')
export class BankController {
  constructor(
    private readonly accountTypes: AccountTypesService,
    private readonly accounts: AccountsService,
  ) {}

  // Account Types
  @UseGuards(AccessTokenGuard)
  @Post('account-types')
  @HttpCode(HttpStatus.CREATED)
  createAccountType(@Body() dto: CreateAccountTypeDto) {
    return this.accountTypes.create({ name: dto.name });
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
