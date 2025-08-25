import { Module } from '@nestjs/common';
import { PermissionGrantsController } from './permissionGrants.controller';

import { AccessApplicationModule } from '@app/application';

@Module({
  imports: [AccessApplicationModule],
  controllers: [PermissionGrantsController],
})
export class PermissionGrantsModule {}
