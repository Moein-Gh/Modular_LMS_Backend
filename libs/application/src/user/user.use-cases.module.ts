import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './use-cases/create-user.usecase';

@Module({
  providers: [CreateUserUseCase],
  exports: [CreateUserUseCase],
})
export class UserUseCasesModule {}
