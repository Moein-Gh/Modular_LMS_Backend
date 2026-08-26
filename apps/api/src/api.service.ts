import { AppLogger } from '@app/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(ApiService.name);
  }

  getHello(): string {
    return 'Hello from ApiService!';
  }
}
