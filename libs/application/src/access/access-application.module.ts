import { Module } from '@nestjs/common';
import { AccessInfraModule } from '@app/infra';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';

@Module({
  imports: [AccessInfraModule],
  providers: [RoleService, PermissionService],
  exports: [RoleService, PermissionService],
})
export class AccessApplicationModule {}
