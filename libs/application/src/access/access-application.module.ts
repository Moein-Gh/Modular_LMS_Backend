import { AccessInfraModule } from '@app/infra';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { PermissionsLoaderService } from './permissions-loader.service';
import { PermissionGrantsService } from './services/permission-grants.service';
import { PermissionsService } from './services/permissions.service';
import { RolePermissionsService } from './services/role-permissions.service';
import { RoleAssignmentsService } from './services/role_assignments.service';
import { RolesService } from './services/roles.service';

@Module({
  imports: [AccessInfraModule, CacheModule.register()],
  providers: [
    RolesService,
    PermissionsService,
    PermissionGrantsService,
    RolePermissionsService,
    RoleAssignmentsService,
    PermissionsLoaderService,
  ],
  exports: [
    RolesService,
    PermissionsService,
    PermissionGrantsService,
    RolePermissionsService,
    RoleAssignmentsService,
    PermissionsLoaderService,
  ],
})
export class AccessApplicationModule {}
