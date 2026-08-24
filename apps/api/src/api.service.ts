import { AppLogger } from '@app/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiAdminService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(ApiAdminService.name);
  }

  getHello(): string {
    return 'Hello from ApiAdminService!';
  }
}
