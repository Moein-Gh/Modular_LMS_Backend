import { ConfigModule } from '@app/config';
import { AuthInfraModule } from '@app/infra/auth/auth-infra.module';
import { PrismaModule } from '@app/infra/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AccessApplicationModule } from '../access/access-application.module';
import { UserApplicationModule } from '../user/user-application.module';
import { AccessTokenGuard } from './guards/access-token.guard';
import { AuthService } from './services/auth.service';
import { IdentitiesService } from './services/identities.service';
import { RegisterUserUseCase } from './use-cases/register-user.usecase';

@Module({
  imports: [
    PrismaModule,
    UserApplicationModule,
    ConfigModule,
    AuthInfraModule,
    AccessApplicationModule,
  ],
  providers: [
    RegisterUserUseCase,
    IdentitiesService,
    AuthService,
    AccessTokenGuard,
  ],
  exports: [
    RegisterUserUseCase,
    IdentitiesService,
    AuthService,
    AccessTokenGuard,
    UserApplicationModule,
  ],
})
export class AuthApplicationModule {}
