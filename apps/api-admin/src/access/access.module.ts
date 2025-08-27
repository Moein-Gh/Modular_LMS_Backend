import { Module } from '@nestjs/common';
import { AccessApplicationModule } from '@app/application';
import { AuthApplicationModule } from '@app/application';
import { RolesController } from './roles/roles.controller';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionGrantsController } from './permissionGrants/permissionGrants.controller';
import { PermissionGrantsModule } from './permissionGrants/permissionGrants.module';
import { RoleAssignmentsController } from './roleAssignments/roleAssignments.controller';
import { ConfigModule } from '@app/config';

@Module({
  imports: [
    ConfigModule,
    AccessApplicationModule,
    AuthApplicationModule,
    PermissionGrantsModule,
  ],
  controllers: [
    RolesController,
    PermissionsController,
    RoleAssignmentsController,
    PermissionGrantsController,
  ],
})
export class AccessModule {}
