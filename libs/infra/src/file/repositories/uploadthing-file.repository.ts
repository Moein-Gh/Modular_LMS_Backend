import { type IFileRepository, UploadInput } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { UTApi } from 'uploadthing/server';

@Injectable()
export class UploadthingFileRepository implements IFileRepository {
  private utapi: UTApi;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    const token = process.env.UPLOADTHING_TOKEN;

    if (!token) {
      throw new Error(
        'UPLOADTHING_TOKEN (or UPLOADTHING_SECRET) environment variable not set',
      );
    }
    this.utapi = new UTApi({ token });
  }

  public async upload(input: UploadInput) {
    try {
      // Create a File object from the buffer
      // Convert Buffer to Uint8Array for Blob compatibility
      const blob = new Blob([new Uint8Array(input.buffer)], {
        type: input.mimeType,
      });
      const file = new File([blob], input.filename, {
        type: input.mimeType,
      });

      // Upload to UploadThing using official SDK
      const response = await this.utapi.uploadFiles(file);

      if (!response.data || response.error) {
        throw new Error(
          `UploadThing upload failed: ${response.error?.message ?? 'Unknown error'}`,
        );
      }

      const uploadedUrl = response.data.url;

      // Store metadata in database
      const created = await this.prisma.file.create({
        data: {
          url: uploadedUrl,
          mimeType: input.mimeType,
          size: input.size,
        },
      });

      return created;
    } catch (error) {
      // Optionally log error here
      throw new Error(
        `File upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async findById(id: string) {
    return this.prisma.file.findUnique({ where: { id } });
  }

  public async findByCode(code: number) {
    return this.prisma.file.findUnique({ where: { code } });
  }

  public async findAll() {
    return this.prisma.file.findMany();
  }

  public async delete(id: string) {
    await this.prisma.file.delete({ where: { id } });
  }
}
