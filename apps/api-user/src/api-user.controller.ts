import { Controller, Get } from '@nestjs/common';
import { ApiUserService } from './api-user.service';

@Controller()
export class ApiUserController {
  constructor(private readonly apiUserService: ApiUserService) {}

  @Get()
  getHello(): string {
    return this.apiUserService.getHello();
  }
}
