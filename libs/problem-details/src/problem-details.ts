export interface ProblemDetails {
  type: string;
  title: string;
  detail?: string;
  instance?: string;
  extensions?: Record<string, string>;
  statusCode: number;
}
