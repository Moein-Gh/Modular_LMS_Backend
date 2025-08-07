import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProblemDetailsException } from './problem-details.exception';
import { ProblemDetails } from './problem-details';
import {
  PROBLEM_DETAILS_MEDIA_TYPE,
  DEFAULT_ERROR_TYPE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_ERROR_STATUS,
  HTTP_STATUS_URL_PREFIX,
  DEFAULT_ERROR_MESSAGE,
} from './index';

/**
 * Interface for HTTP exception response objects
 */
interface ErrorResponse {
  message?: string | string[];
  [key: string]: any;
}

/**
 * Global exception filter that converts exceptions to RFC 7807 Problem Details
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestPath = request.path;

    // Generate the appropriate problem details based on exception type
    const problem = this.createProblemDetails(exception, requestPath);

    // Log the error (but not in tests)
    if (process.env.NODE_ENV !== 'test') {
      this.logger.error(
        `Exception: ${problem.detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Send the response
    response
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
