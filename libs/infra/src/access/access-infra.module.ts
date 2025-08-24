import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaPermissionRepository } from './repositories/prisma-permission.repository';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '@app/domain';

const roleRepositoryProvider = {
  provide: ROLE_REPOSITORY,
  useExisting: PrismaRoleRepository,
};

const permissionRepositoryProvider = {
  provide: PERMISSION_REPOSITORY,
  useExisting: PrismaPermissionRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaRoleRepository,
    PrismaPermissionRepository,
    roleRepositoryProvider,
    permissionRepositoryProvider,
  ],
  exports: [roleRepositoryProvider, permissionRepositoryProvider],
})
export class AccessInfraModule {}
