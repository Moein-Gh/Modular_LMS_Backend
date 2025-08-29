import { Module } from '@nestjs/common';
import { PermissionGrantsController } from './permissionGrants.controller';

import { AccessApplicationModule } from '@app/application/access/access-application.module';
import { AuthApplicationModule } from '@app/application';
import { ConfigModule } from '@app/config';

@Module({
  imports: [AccessApplicationModule, AuthApplicationModule, ConfigModule],
  controllers: [PermissionGrantsController],
})
export class PermissionGrantsModule {}
