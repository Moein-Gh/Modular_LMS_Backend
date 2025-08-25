import { Module } from '@nestjs/common';
import { AccessInfraModule } from '@app/infra';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { PermissionGrantService } from './services/permission-grant.service';
import { RoleAssignmentService } from './services/role_assignment.service';

@Module({
  imports: [AccessInfraModule],
  providers: [
    RoleService,
    PermissionService,
    PermissionGrantService,
    RoleAssignmentService,
  ],
  exports: [
    RoleService,
    PermissionService,
    PermissionGrantService,
    RoleAssignmentService,
  ],
})
export class AccessApplicationModule {}
