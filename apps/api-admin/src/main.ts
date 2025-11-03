import { setupDocs } from '@app/infra/docs/openapi';
import { ProcessErrorHandlers } from '@app/logger';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiAdminModule } from './api-admin.module';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiAdminModule, {
    logger: ['warn', 'error'],
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  setupDocs(app, 'Loan Platform – Admin API');

  const port = Number(process.env.port ?? 3000);
  await app.listen(port);
  console.log('---------------------------------------');
  console.log(`------ Admin API ready on :${port} -------`);
  console.log('---------------------------------------');
}

void bootstrap();
