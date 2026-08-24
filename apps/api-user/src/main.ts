import { ProcessErrorHandlers } from '@app/logger';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiUserModule } from './api-user.module';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiUserModule);

  // Set global prefix for user API
  app.setGlobalPrefix('user');

  // Build a permissive-but-safe origin checker for local/LAN development
  const defaultOrigins = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  const envOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  for (const o of envOrigins) defaultOrigins.add(o);

  // Allow common private network ranges for quick device testing (HTTP only)
  const privateNetRegexes = [
    /^http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}(?::\d+)?$/,
    /^http:\/\/10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?::\d+)?$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3}(?::\d+)?$/,
  ];

  // Enable CORS
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // Non-browser or same-origin requests have no Origin header
      if (!origin) {
        callback(null, true);
        return;
      }
      if (defaultOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      if (privateNetRegexes.some((re) => re.test(origin))) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
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

  // ProblemDetailsFilter is registered via ProblemDetailsModule
  const port = process.env.PORT ?? process.env.USER_API_PORT ?? 3000;
  await app.listen(Number(port), '0.0.0.0');
}

void bootstrap();
