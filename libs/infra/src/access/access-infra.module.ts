import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaPermissionRepository } from './repositories/prisma-permission.repository';
import {
  ROLE_REPOSITORY,
  PERMISSION_REPOSITORY,
  ROLE_ASSIGNMENT_REPOSITORY,
  PERMISSION_GRANT_REPOSITORY,
} from '@app/domain';
import { PrismaPermissionGrantRepository } from './repositories/prisma-permission-grant.repository';

import { PrismaRoleAssignmentRepository } from './repositories/prisma-role-assignment.repository';

const roleRepositoryProvider = {
  provide: ROLE_REPOSITORY,
  useExisting: PrismaRoleRepository,
};

const permissionRepositoryProvider = {
  provide: PERMISSION_REPOSITORY,
  useExisting: PrismaPermissionRepository,
};

const roleAssignmentRepositoryProvider = {
  provide: ROLE_ASSIGNMENT_REPOSITORY,
  useExisting: PrismaRoleAssignmentRepository,
};

const permissionGrantRepositoryProvider = {
  provide: PERMISSION_GRANT_REPOSITORY,
  useExisting: PrismaPermissionGrantRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaPermissionRepository,
    PrismaPermissionGrantRepository,
    {
      provide: ROLE_REPOSITORY,
      useClass: PrismaRoleRepository,
    },
    {
      provide: PERMISSION_GRANT_REPOSITORY,
      useClass: PrismaPermissionGrantRepository,
    },
    // ...other providers...
    PrismaRoleAssignmentRepository,
    permissionRepositoryProvider,
    roleAssignmentRepositoryProvider,
    permissionGrantRepositoryProvider,
  ],
  exports: [
    roleRepositoryProvider,
    permissionRepositoryProvider,
    roleAssignmentRepositoryProvider,
    permissionGrantRepositoryProvider,
  ],
})
export class AccessInfraModule {}
