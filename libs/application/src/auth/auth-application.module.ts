import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/infra/prisma/prisma.module';
import { RegisterUserUseCase } from './use-cases/register-user.usecase';
import { IdentityService } from './services/identity.service';
import { UserApplicationModule } from '../user/user-application.module';
import { AuthService } from './services/auth.service';
import { ConfigModule } from '@app/config';

@Module({
  imports: [PrismaModule, UserApplicationModule, ConfigModule],
  providers: [RegisterUserUseCase, IdentityService, AuthService],
  exports: [RegisterUserUseCase, IdentityService, AuthService],
})
export class AuthApplicationModule {}
