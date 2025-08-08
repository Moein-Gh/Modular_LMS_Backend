import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { createLoggerConfig } from './logger.config';
import { AppLogger } from './logger.service';
import { SentryProvider } from './sentry/sentry.provider';

@Module({
  imports: [PinoLoggerModule.forRoot(createLoggerConfig())],
  providers: [AppLogger, SentryProvider],
  exports: [AppLogger, SentryProvider],
})
export class LoggerModule {}
