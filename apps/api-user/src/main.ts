import { NestFactory } from '@nestjs/core';
import { ApiUserModule } from './api-user.module';
import { ProcessErrorHandlers } from '@app/logger';

async function bootstrap(): Promise<void> {
  ProcessErrorHandlers.setupProcessHandlers();

  const app = await NestFactory.create(ApiUserModule);

  // ProblemDetailsFilter is registered via ProblemDetailsModule
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
