import * as Sentry from '@sentry/node';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger.service';
import { SentryProvider } from './sentry.provider';

@Catch()
@Injectable()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLogger,
    private readonly sentryProvider: SentryProvider,
  ) {
    this.logger.setContext(SentryExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Only report to Sentry if it's initialized
    if (this.sentryProvider.isInitialized()) {
      this.reportToSentry(exception, request);
    }

    // Log the exception locally
    this.logger.error('Unhandled exception occurred', {
      error: exception,
      requestId: request.headers['x-request-id'] || 'unknown',
      url: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
    });

    // Note: This filter should be registered BEFORE your Problem Details filter
    // so that Problem Details can handle the actual response formatting
    throw exception;
  }

  private reportToSentry(exception: unknown, request: Request): void {
    Sentry.withScope((scope) => {
      // Add request context
      const requestIdHeader = request.headers['x-request-id'];
      const requestId = Array.isArray(requestIdHeader)
        ? requestIdHeader.join(',')
        : requestIdHeader || 'unknown';

      scope.setTag('requestId', requestId);
      scope.setContext('request', {
        url: request.url,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        body: this.sanitizeBody(request.body),
      });

      // Set user context if available
      if (request.user) {
        scope.setUser({
          id: request.user.id,
        });
      }

      // Capture the exception
      Sentry.captureException(exception);
    });
  }

  private sanitizeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = { ...body } as Record<string, unknown>;

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
