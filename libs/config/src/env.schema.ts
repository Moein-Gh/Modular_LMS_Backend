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
  /* Auth Module */
  JWT_SECRET: z.string().min(32),
  SMS_API_KEY: z.string().nonempty(),
  SMS_API_SECRET: z.string().nonempty(),
  SMS_SENDER_ID: z.string().nonempty(),
  // Token expiry times (in seconds)
  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().int().positive().default(900), // 15 minutes
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().int().positive().default(2592000), // 30 days
  SMS_CODE_EXPIRES_IN: z.coerce.number().int().positive().default(300), // 5 minutes
});

export type EnvVars = z.infer<typeof envSchema>;
