import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import type { EnvVars } from './env.schema';

@Injectable()
export class ConfigService {
  constructor(private readonly nestConfig: NestConfigService<EnvVars, true>) {}

  /**
   * Get a configuration value by key (type-safe)
   * @param key keyof EnvVars
   */
  get<K extends keyof EnvVars>(key: K): EnvVars[K] {
    return this.nestConfig.get<K>(key, { infer: true }) as EnvVars[K];
  }
}
