import { USER_REPOSITORY } from '@app/domain';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useExisting: PrismaUserRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [PrismaUserRepository, userRepositoryProvider],
  exports: [userRepositoryProvider, PrismaUserRepository],
})
export class UserInfraModule {}
