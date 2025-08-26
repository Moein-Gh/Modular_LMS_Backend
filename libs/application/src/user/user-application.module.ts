import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UserInfraModule } from '@app/infra/user/user.infra.module';

@Module({
  imports: [UserInfraModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserApplicationModule {}
