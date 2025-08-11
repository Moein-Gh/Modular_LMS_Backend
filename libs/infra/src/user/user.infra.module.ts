import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { USER_REPOSITORY } from '@app/domain';

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useExisting: PrismaUserRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [PrismaUserRepository, userRepositoryProvider],
  exports: [userRepositoryProvider],
})
export class UserInfraModule {}
