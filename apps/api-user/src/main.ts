import { NestFactory } from '@nestjs/core';
import { ApiUserModule } from './api-user.module';
import { ProcessErrorHandlers } from '@app/logger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiUserModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // ProblemDetailsFilter is registered via ProblemDetailsModule
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
