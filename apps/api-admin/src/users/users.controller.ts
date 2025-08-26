import { Controller } from '@nestjs/common';
import { UsersService } from '@app/application';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
