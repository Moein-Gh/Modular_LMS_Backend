import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type pino from 'pino';

@Injectable()
export class AppLogger {
  constructor(
    @InjectPinoLogger(AppLogger.name) private readonly logger: PinoLogger,
  ) {}

  setContext(context: string): void {
    this.logger.setContext(context);
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      this.logger.trace(meta, message);
    } else {
      this.logger.trace(message);
    }
  }
  debug(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      this.logger.debug(meta, message);
    } else {
      this.logger.debug(message);
    }
  }
  info(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      this.logger.info(meta, message);
    } else {
      this.logger.info(message);
    }
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    if (meta) {
      this.logger.warn(meta, message);
    } else {
      this.logger.warn(message);
    }
  }
  error(err: unknown, meta?: Record<string, unknown>): void {
    if (err instanceof Error) {
      this.logger.error(
        {
          err: { name: err.name, message: err.message, stack: err.stack },
          ...(meta ?? {}),
        },
        err.message,
      );
    } else {
      if (meta) {
        this.logger.error(meta, String(err));
      } else {
        this.logger.error(String(err));
      }
    }
  }

  child(bindings: Record<string, unknown>): pino.Logger {
    return this.logger.logger.child(bindings);
  }

  withStandardFields(extra?: Record<string, unknown>): pino.Logger {
    return this.logger.logger.child({
      service: process.env.SERVICE_NAME || 'lms-backend',
      env: process.env.NODE_ENV || 'development',
      ...(extra ?? {}),
    });
  }
}
