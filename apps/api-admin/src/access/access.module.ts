import {
  AccessApplicationModule,
  AccessTokenGuard,
  AuthApplicationModule,
  PermissionsGuard,
} from '@app/application';
import { ConfigModule } from '@app/config';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGrantsController } from './permissionGrants/permissionGrants.controller';
import { PermissionGrantsModule } from './permissionGrants/permissionGrants.module';
import { PermissionsController } from './permissions/permissions.controller';
import { RoleAssignmentsController } from './roleAssignments/roleAssignments.controller';
import { RolesController } from './roles/roles.controller';

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
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AccessApplicationModule],
})
export class AccessModule {}
