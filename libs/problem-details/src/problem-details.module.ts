// libs/problem-details/src/problem-details.module.ts
import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ProblemDetailsFilter } from './problem-details.filter';

@Global()
@Module({
  providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
})
export class ProblemDetailsModule {}
