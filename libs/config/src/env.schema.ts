// libs/config/src/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  /* build/runtime toggles */
  API_BUILD_TARGET: z.enum(['dev', 'prod']).optional(),

  /* ports (strings → numbers) */
  USER_API_PORT: z.coerce.number().int().positive(),
  ADMIN_API_PORT: z.coerce.number().int().positive(),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),

  /* Postgres & Prisma */
  POSTGRES_DB: z.string().nonempty(),
  POSTGRES_USER: z.string().nonempty(),
  POSTGRES_PASSWORD: z.string().nonempty(),
  DATABASE_URL: z.string().url(),

  /* Logging */
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error', 'silent'])
    .default('info'),

  /* Service Info */
  SERVICE_NAME: z.string().nonempty(),

  /* Request ID */
  REQUEST_ID_HEADER: z.string().default('x-request-id'),

  /* Sentry */
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z
    .string()
    .regex(/^0(\.\d+)?$|^1(\.0+)?$/)
    .optional(),
});

export type EnvVars = z.infer<typeof envSchema>;
