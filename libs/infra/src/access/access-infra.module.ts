import {
  PERMISSION_GRANT_REPOSITORY,
  PERMISSION_REPOSITORY,
  ROLE_ASSIGNMENT_REPOSITORY,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
} from '@app/domain';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaPermissionGrantRepository } from './repositories/prisma-permission-grant.repository';
import { PrismaPermissionRepository } from './repositories/prisma-permission.repository';
import { PrismaRolePermissionRepository } from './repositories/prisma-role-permission.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';

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

const rolePermissionRepositoryProvider = {
  provide: ROLE_PERMISSION_REPOSITORY,
  useExisting: PrismaRolePermissionRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaPermissionRepository,
    PrismaPermissionGrantRepository,
    PrismaRolePermissionRepository,
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
    rolePermissionRepositoryProvider,
  ],
  exports: [
    roleRepositoryProvider,
    permissionRepositoryProvider,
    roleAssignmentRepositoryProvider,
    permissionGrantRepositoryProvider,
    rolePermissionRepositoryProvider,
  ],
})
export class AccessInfraModule {}
