// libs/config/src/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),

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
});

export type EnvVars = z.infer<typeof envSchema>;
