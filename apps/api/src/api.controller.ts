import { Public } from '@app/application';
import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('admin')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.apiService.getHello();
  }
}
