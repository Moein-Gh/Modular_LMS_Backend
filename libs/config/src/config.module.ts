// libs/config/src/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfig } from '@nestjs/config';
import { envSchema } from './env.schema';

import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService } from './config.service';
import type { EnvVars } from './env.schema';

@Module({
  imports: [
    NestConfig.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      validate: (cfg) => {
        const parsed = envSchema.safeParse(cfg);
        if (!parsed.success) {
          throw new Error(JSON.stringify(parsed.error.issues, null, 2));
        }
        return parsed.data;
      },
    }),
  ],
  providers: [
    {
      provide: ConfigService,
      useFactory: (nestConfig: NestConfigService<EnvVars, true>) =>
        new ConfigService(nestConfig),
      inject: [NestConfigService],
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
