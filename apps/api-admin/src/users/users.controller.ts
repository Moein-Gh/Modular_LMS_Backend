import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UsersService } from '@app/application';
import type { CreateUserResult } from '@app/application';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(): Promise<CreateUserResult> {
    return await this.usersService.create();
  }
}
