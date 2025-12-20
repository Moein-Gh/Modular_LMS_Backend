import { isAppError } from '@app/application';
import { SentryProvider } from '@app/logger';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_ERROR_STATUS,
  DEFAULT_ERROR_TITLE,
  DEFAULT_ERROR_TYPE,
  HTTP_STATUS_URL_PREFIX,
  PROBLEM_DETAILS_MEDIA_TYPE,
} from './index';
import { ProblemDetails } from './problem-details';
import { ProblemDetailsException } from './problem-details.exception';

/**
 * Interface for HTTP exception response objects
 */
interface ErrorResponse {
  message?: string | string[];
  [key: string]: any;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly sentryProvider: SentryProvider) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();

    // 1) Generic mapping for any AppError from the application layer
    if (isAppError(exception)) {
      const type =
        exception.type ?? `${HTTP_STATUS_URL_PREFIX}${exception.status}`;
      const problem: ProblemDetails = {
        type,
        title: exception.title,
        statusCode: exception.status,
        detail: exception.detail,
        instance: req.url,
        occuredAt: new Date(),
        extensions: { code: exception.code },
      };
      res
        .status(problem.statusCode)
        .setHeader('Content-Type', PROBLEM_DETAILS_MEDIA_TYPE)
        .json(problem);
      return;
    }

    const requestPath = req.path;

    // Generate the appropriate problem details based on exception type
    const problem = this.createProblemDetails(exception, requestPath);

    // If it's a server error (500), show a generic user-friendly message
    if (problem.statusCode === 500) {
      problem.detail = 'مشکلی پیش آمده است';
    }

    // Log the error (but not in tests)
    if (process.env.NODE_ENV !== 'test') {
      this.logger.error(
        `Exception: ${problem.detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Determine HTTP status (keep your existing logic)
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    // Report only unexpected/5xx
    if (this.sentryProvider.isInitialized() && status >= 500) {
      Sentry.withScope((scope) => {
        // requestId
        const ridHeader = req.headers['x-request-id'];
        const requestId = Array.isArray(ridHeader)
          ? ridHeader.join(',')
          : (ridHeader ?? 'unknown');

        scope.setTag('requestId', requestId);
        scope.setContext('request', {
          url: req.url,
          method: req.method,
          headers: sanitizeHeaders(req.headers as Record<string, unknown>),
          query: req.query,
          body: sanitizeBody(req.body),
        });

        const user = getUser(req);
        if (user) scope.setUser(user);

        Sentry.captureException(exception);
      });
    }

    // Send the response
    res
      .status(problem.statusCode)
      .setHeader('Content-Type', PROBLEM_DETAILS_MEDIA_TYPE)
      .json(problem);
  }

  /**
   * Creates appropriate problem details based on the exception type
   */
  private createProblemDetails(
    exception: unknown,
    requestPath: string,
  ): ProblemDetails {
    if (exception instanceof ProblemDetailsException) {
      return this.handleProblemDetailsException(exception);
    } else if (exception instanceof HttpException) {
      return this.handleHttpException(exception, requestPath);
    } else {
      return this.handleUnknownException(requestPath);
    }
  }

  /**
   * Handles exceptions that already implement ProblemDetailsException
   */
  private handleProblemDetailsException(
    exception: ProblemDetailsException,
  ): ProblemDetails {
    return { ...exception };
  }

  /**
   * Handles standard NestJS HttpExceptions
   */
  private handleHttpException(
    exception: HttpException,
    requestPath: string,
  ): ProblemDetails {
    const status = exception.getStatus();
    const responseBody = exception.getResponse() as ErrorResponse;

    return {
      type: `${HTTP_STATUS_URL_PREFIX}${status}`,
      title: HttpStatus[status] ?? 'Error',
      statusCode: status,
      detail: this.extractErrorMessage(responseBody),
      instance: requestPath,
      occuredAt: new Date(),
    };
  }

  /**
   * Handles unknown exceptions
   */
  private handleUnknownException(requestPath: string): ProblemDetails {
    return {
      type: DEFAULT_ERROR_TYPE,
      title: DEFAULT_ERROR_TITLE,
      statusCode: DEFAULT_ERROR_STATUS,
      detail: 'Unexpected error',
      instance: requestPath,
      occuredAt: new Date(),
    };
  }

  /**
   * Extracts a readable error message from response body
   */
  private extractErrorMessage(detail: ErrorResponse | string): string {
    if (typeof detail === 'string') {
      return detail;
    }

    return this.concatenateMessages(detail.message || DEFAULT_ERROR_MESSAGE);
  }

  /**
   * Joins array of messages into a single string
   */
  private concatenateMessages(messages: string | string[]): string {
    if (Array.isArray(messages)) {
      return messages.join(', ');
    }
    return messages;
  }
}

function sanitizeHeaders(
  headers: Record<string, unknown>,
): Record<string, unknown> {
  const sensitive = ['authorization', 'cookie', 'x-api-key'];
  const out = { ...headers };
  for (const h of sensitive) if (out[h]) out[h] = '[REDACTED]';
  return out;
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sensitive = ['password', 'token', 'secret', 'apiKey'];
  const out = { ...(body as Record<string, unknown>) };
  for (const f of sensitive) if (out[f]) out[f] = '[REDACTED]';
  return out;
}

function getUser(req: Request): { id?: string } | undefined {
  const maybeUser = (req as unknown as { user?: unknown }).user;
  if (maybeUser && typeof maybeUser === 'object') {
    const u = maybeUser as Record<string, unknown>;
    const id =
      typeof u.id === 'string' || typeof u.id === 'number'
        ? String(u.id)
        : undefined;
    return id ? { id } : undefined;
  }
  return undefined;
}
