import { IDENTITY_REPOSITORY } from '@app/domain';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaIdentityRepository } from './repositories/prisma-identity.repository';
import { Module } from '@nestjs/common';

const identityRepositoryProvider = {
  provide: IDENTITY_REPOSITORY,
  useExisting: PrismaIdentityRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [PrismaIdentityRepository, identityRepositoryProvider],
  exports: [identityRepositoryProvider],
})
export class AuthInfraModule {}
