import { UserInfraModule } from '@app/infra/user/user.infra.module';
import { Module } from '@nestjs/common';
import { LedgerApplicationModule } from '../ledger/ledger-application.module';
import { UsersService } from './services/users.service';

@Module({
  imports: [UserInfraModule, LedgerApplicationModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserApplicationModule {}
