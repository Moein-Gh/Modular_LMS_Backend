import { NestFactory } from '@nestjs/core';
import { ApiAdminModule } from './api-admin.module';
import { setupDocs } from '@app/infra/docs/openapi';
import { ProcessErrorHandlers, SentryExceptionFilter } from '@app/logger';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiAdminModule);
  setupDocs(app, 'Loan Platform – User API');

  const sentryFilter = app.get(SentryExceptionFilter);
  app.useGlobalFilters(sentryFilter);

  await app.listen(process.env.port ?? 3000);
}

void bootstrap();
