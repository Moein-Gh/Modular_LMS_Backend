import { NestFactory } from '@nestjs/core';
import { ApiAdminModule } from './api-admin.module';
import { setupDocs } from '@app/infra/docs/openapi';

async function bootstrap() {
  const app = await NestFactory.create(ApiAdminModule);
  setupDocs(app, 'Loan Platform – User API');
  await app.listen(process.env.port ?? 3000);
}

bootstrap();
