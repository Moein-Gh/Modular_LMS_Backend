import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { createLoggerConfig } from './logger.config';
import { AppLogger } from './logger.service';
import { SentryProvider } from './sentry/sentry.provider';
import { SentryExceptionFilter } from './sentry/sentry-exception.filter';

@Module({
  imports: [PinoLoggerModule.forRoot(createLoggerConfig())],
  providers: [AppLogger, SentryProvider, SentryExceptionFilter],
  exports: [AppLogger, SentryProvider, SentryExceptionFilter],
})
export class LoggerModule {}
