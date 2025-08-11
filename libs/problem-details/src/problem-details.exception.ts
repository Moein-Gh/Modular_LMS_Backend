import { ProblemDetails } from '@app/problem-details/problem-details';
import { HttpException } from '@nestjs/common';

export class ProblemDetailsException
  extends HttpException
  implements ProblemDetails
{
  readonly type: string;
  readonly title: string;
  readonly detail?: string;
  readonly instance?: string;
  readonly extensions?: Record<string, any>;
  readonly statusCode: number; // HTTP status code
  readonly occuredAt: Date;

  constructor(problem: ProblemDetails & { status: number }) {
    super(problem, problem.status); // pass real status to base class
    Object.assign(this, problem);
  }
}
