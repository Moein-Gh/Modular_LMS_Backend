// libs/problem-details/src/problem-details.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { ProblemDetailsException } from './problem-details.exception';
import { ProblemDetails } from './problem-details';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let problem: ProblemDetails;

    if (exception instanceof ProblemDetailsException) {
      problem = { ...exception };
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      problem = {
        type: `https://httpstatuses.com/${status}`,
        title: HttpStatus[status] ?? 'Error',
        statusCode: status,
        detail: (exception.getResponse() as any)?.message ?? exception.message,
        instance: request.path,
      };
    } else {
      problem = {
        type: 'about:blank',
        title: 'Internal Server Error',
        statusCode: 500,
        detail: (exception as any)?.message ?? 'Unexpected error',
        instance: request.path,
      };
    }

    response
      .status(problem.statusCode)
      .setHeader('Content-Type', 'application/problem+json')
      .json(problem);
  }
}
