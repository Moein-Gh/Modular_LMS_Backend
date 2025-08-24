import { Module } from '@nestjs/common';
import { AccessApplicationModule } from '@app/application';
import { RolesController } from './roles/roles.controller';
import { PermissionsController } from './permissions/permissions.controller';

@Module({
  imports: [AccessApplicationModule],
  controllers: [RolesController, PermissionsController],
})
export class AccessModule {}
