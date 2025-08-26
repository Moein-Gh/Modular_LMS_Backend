import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaIdentityRepository } from './repositories/prisma-identity.repository';
import { IDENTITY_REPOSITORY } from '@app/domain';

const identityRepositoryProvider = {
  provide: IDENTITY_REPOSITORY,
  useExisting: PrismaIdentityRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [identityRepositoryProvider],
  exports: [identityRepositoryProvider],
})
export class AccessInfraModule {}
