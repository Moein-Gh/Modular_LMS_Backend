import * as Sentry from '@sentry/node';

interface RateLimiter {
  lastReportTime: number;
  count: number;
}

export class ProcessErrorHandlers {
  private static rateLimiter: RateLimiter = {
    lastReportTime: 0,
    count: 0,
  };

  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly MAX_REPORTS_PER_WINDOW = 5;

  static setupProcessHandlers(): void {
    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<unknown>) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);

        if (this.shouldReport()) {
          Sentry.withScope((scope) => {
            scope.setTag('errorType', 'unhandledRejection');
            scope.setContext('promise', {
              promise: {
                type: promise.constructor?.name ?? 'Promise',
                inspected: JSON.stringify(
                  promise,
                  Object.getOwnPropertyNames(promise),
                ),
              },
            });
            Sentry.captureException(reason);
          });
        }
      },
    );

    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);

      if (this.shouldReport()) {
        Sentry.withScope((scope) => {
          scope.setTag('errorType', 'uncaughtException');
          Sentry.captureException(error);
        });
      }

      // For uncaught exceptions, we should exit gracefully
      process.exit(1);
    });
  }

  private static shouldReport(): boolean {
    const now = Date.now();

    // Reset counter if we're in a new time window
    if (now - this.rateLimiter.lastReportTime > this.RATE_LIMIT_WINDOW) {
      this.rateLimiter.count = 0;
      this.rateLimiter.lastReportTime = now;
    }

    // Check if we're under the rate limit
    if (this.rateLimiter.count < this.MAX_REPORTS_PER_WINDOW) {
      this.rateLimiter.count++;
      return true;
    }

    return false;
  }
}
