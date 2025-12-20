import { PrismaModule } from '@app/infra';
import { FileInfraModule } from '@app/infra/file';
import { Module } from '@nestjs/common';
import { FilesService } from './services/files.service';

@Module({
  imports: [FileInfraModule, PrismaModule],
  providers: [FilesService],
  exports: [FilesService],
})
export class FileApplicationModule {}
