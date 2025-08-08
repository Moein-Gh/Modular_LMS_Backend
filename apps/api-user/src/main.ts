import { NestFactory } from '@nestjs/core';
import { ProcessErrorHandlers, SentryExceptionFilter } from '@app/logger';
import { ApiUserModule } from './api-user.module';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiUserModule);

  const sentryFilter = app.get(SentryExceptionFilter);
  app.useGlobalFilters(sentryFilter);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
