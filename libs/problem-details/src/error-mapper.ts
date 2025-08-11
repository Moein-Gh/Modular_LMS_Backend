import type { Request } from 'express';
import type { ProblemDetails } from './problem-details';

// Multi-provider token for custom mappers registered by any module
export const PROBLEM_ERROR_MAPPERS = Symbol('PROBLEM_ERROR_MAPPERS');

export interface ProblemErrorMapper {
  // Tell if this mapper can handle the thrown error
  canHandle(error: unknown): boolean;

  // Convert the error to a Problem Details payload (with correct statusCode)
  toProblem(error: unknown, req: Request): ProblemDetails;
}
