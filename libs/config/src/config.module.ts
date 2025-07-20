// libs/config/src/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfig } from '@nestjs/config';
import { envSchema } from './env.schema';

@Module({
  imports: [
    NestConfig.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (cfg) => {
        const parsed = envSchema.safeParse(cfg);
        if (!parsed.success) {
          throw new Error(JSON.stringify(parsed.error.issues, null, 2));
        }
        return parsed.data;
      },
    }),
  ],
})
export class ConfigModule {}
