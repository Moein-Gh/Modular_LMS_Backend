import { AccessInfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { PermissionGrantsService } from './services/permission-grants.service';
import { PermissionsService } from './services/permissions.service';
import { RoleAssignmentsService } from './services/role_assignments.service';
import { RolesService } from './services/roles.service';

@Module({
  imports: [AccessInfraModule],
  providers: [
    RolesService,
    PermissionsService,
    PermissionGrantsService,
    RoleAssignmentsService,
  ],
  exports: [
    RolesService,
    PermissionsService,
    PermissionGrantsService,
    RoleAssignmentsService,
  ],
})
export class AccessApplicationModule {}
