export interface AppErrorParams {
  code: string;
  status: number;
  title: string;
  detail?: string;
  type?: string;
}

/**
 * Framework-agnostic base error for the application layer.
 * ProblemDetails filter can read its fields to build RFC7807 responses.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly type?: string;

  constructor(params: AppErrorParams) {
    super(params.detail ?? params.title);
    this.name = new.target.name;
    this.code = params.code;
    this.status = params.status;
    this.title = params.title;
    this.detail = params.detail;
    this.type = params.type;
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
