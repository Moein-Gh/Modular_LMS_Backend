import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/infra/prisma/prisma.module';
import { RegisterUserUseCase } from './use-cases/register-user.usecase';
import { IdentityService } from './services/identity.service';
import { UserApplicationModule } from '../user/user-application.module';
import { AuthService } from './services/auth.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import { ConfigModule } from '@app/config';
import { AuthInfraModule } from '@app/infra/auth/auth-infra.module';

@Module({
  imports: [PrismaModule, UserApplicationModule, ConfigModule, AuthInfraModule],
  providers: [
    RegisterUserUseCase,
    IdentityService,
    AuthService,
    AccessTokenGuard,
  ],
  exports: [
    RegisterUserUseCase,
    IdentityService,
    AuthService,
    AccessTokenGuard,
    UserApplicationModule,
  ],
})
export class AuthApplicationModule {}
