import { DEVICE_REPOSITORY, IDENTITY_REPOSITORY } from '@app/domain';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaDeviceRepository } from './repositories/prisma-device.repository';
import { PrismaIdentityRepository } from './repositories/prisma-identity.repository';

const identityRepositoryProvider = {
  provide: IDENTITY_REPOSITORY,
  useExisting: PrismaIdentityRepository,
};

const deviceRepositoryProvider = {
  provide: DEVICE_REPOSITORY,
  useExisting: PrismaDeviceRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaIdentityRepository,
    PrismaDeviceRepository,
    identityRepositoryProvider,
    deviceRepositoryProvider,
  ],
  exports: [identityRepositoryProvider, deviceRepositoryProvider],
})
export class AuthInfraModule {}
