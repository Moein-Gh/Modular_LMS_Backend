export interface ProblemDetails {
  type: string;
  title: string;
  detail?: string;
  instance?: string;
  extensions?: Record<string, string>;
  statusCode: number;
  occuredAt: Date;
  // errors?: Array<{ field: string; message: string }>; Add later
}
