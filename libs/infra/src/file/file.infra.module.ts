import { FILE_REPOSITORY } from '@app/domain';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadthingFileRepository } from './repositories/uploadthing-file.repository';

const fileRepositoryProvider = {
  provide: FILE_REPOSITORY,
  useExisting: UploadthingFileRepository,
};

@Module({
  imports: [PrismaModule],
  providers: [UploadthingFileRepository, fileRepositoryProvider],
  exports: [fileRepositoryProvider, UploadthingFileRepository],
})
export class FileInfraModule {}
