import { setupDocs } from '@app/infra/docs/openapi';
import { ProcessErrorHandlers } from '@app/logger';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ForbidDeletedFieldsPipe } from './common/pipes/forbid-deleted-fields.pipe';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiModule, {
    logger: ['warn', 'error'],
  });

  // Wide-open CORS: reflects any request origin and any requested headers.
  // `origin: true` (not '*') is required here because credentials: true
  // forbids the wildcard per the CORS spec — this reflects the caller's
  // Origin header back instead, which satisfies the spec while still
  // accepting every origin.
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalPipes(
    new ForbidDeletedFieldsPipe(),
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  setupDocs(app, 'Loan Platform API');

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log('---------------------------------------');
  console.log(`------ API ready on :${port} -------`);
  console.log('---------------------------------------');
}

void bootstrap();
