import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiUserService {
  getHello(): string {
    return 'Hello World!';
  }
}
