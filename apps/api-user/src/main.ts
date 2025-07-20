import { NestFactory } from '@nestjs/core';
import { ApiUserModule } from './api-user.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiUserModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
