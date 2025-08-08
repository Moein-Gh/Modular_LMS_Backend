import { NestFactory } from '@nestjs/core';
import { ApiAdminModule } from './api-admin.module';
import { setupDocs } from '@app/infra/docs/openapi';
import { ProcessErrorHandlers } from '@app/logger';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiAdminModule);

  // ProblemDetailsFilter is registered via ProblemDetailsModule
  setupDocs(app, 'Loan Platform – Admin API');

  await app.listen(process.env.port ?? 3000);
}

void bootstrap();
