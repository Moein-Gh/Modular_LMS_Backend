import { FilesService } from '@app/application';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UUID_V4_PIPE } from '../common/pipes/UUID.pipe';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    const created = await this.filesService.upload(file);
    return created;
  }

  @Get()
  async findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', UUID_V4_PIPE) id: string) {
    const file = await this.filesService.findById(id);
    return file;
  }

  @Delete(':id')
  async remove(@Param('id', UUID_V4_PIPE) id: string) {
    await this.filesService.delete(id);
    return { success: true };
  }
}
