import { FileInfraModule } from '@app/infra/file';
import { Module } from '@nestjs/common';
import { FilesService } from './services/files.service';

@Module({
  imports: [FileInfraModule],
  providers: [FilesService],
  exports: [FilesService],
})
export class FileApplicationModule {}
