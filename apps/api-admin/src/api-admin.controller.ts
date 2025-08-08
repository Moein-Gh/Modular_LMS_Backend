import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiAdminService } from './api-admin.service';

@Controller()
export class ApiAdminController {
  constructor(private readonly apiAdminService: ApiAdminService) {}

  @Get()
  getHello(): string {
    return this.apiAdminService.getHello();
  }

  @Get('test-exception')
  testException(): never {
    throw new BadRequestException(
      'Test exception - should be caught by SentryExceptionFilter',
    );
  }

  @Get('test-unhandled-rejection')
  async testUnhandledRejection(): Promise<string> {
    await Promise.reject(new Error('Test unhandled rejection'));
    return 'Unhandled rejection triggered';
  }
}
