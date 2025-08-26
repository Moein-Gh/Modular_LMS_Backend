import { Module } from '@nestjs/common';
import { PermissionGrantsController } from './permissionGrants.controller';

import { AccessApplicationModule } from '@app/application/access/access-application.module';

@Module({
  imports: [AccessApplicationModule],
  controllers: [PermissionGrantsController],
})
export class PermissionGrantsModule {}
