import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Injectable, OnModuleInit } from '@nestjs/common';

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

@Injectable()
export class SentryProvider implements OnModuleInit {
  private initialized = false;

  onModuleInit(): void {
    this.initializeSentry();
  }

  private initializeSentry(): void {
    const config = this.getSentryConfig();

    if (!config.dsn) {
      console.log('Sentry DSN not provided, skipping initialization');
      return;
    }

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment || process.env.NODE_ENV || 'development',
      release: config.release || this.getRelease(),
      tracesSampleRate: config.tracesSampleRate || 0.05,
      integrations: [nodeProfilingIntegration()],
      beforeSend: (event: Sentry.ErrorEvent) => this.beforeSendFilter(event),
    });

    this.initialized = true;
    console.log('Sentry initialized successfully');
  }

  private getSentryConfig(): SentryConfig {
    return {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT,
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : undefined,
    };
  }

  private getRelease(): string | undefined {
    return process.env.CI_COMMIT_SHA || process.env.GITHUB_SHA || undefined;
  }

  private beforeSendFilter(
    event: Sentry.ErrorEvent,
  ): Sentry.ErrorEvent | PromiseLike<Sentry.ErrorEvent | null> | null {
    // Drop non-5xx errors or expected domain errors if needed
    if (event.exception?.values?.[0]?.type === 'HttpException') {
      return null; // Skip HTTP exceptions handled by our Problem Details filter
    }
    return event;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
