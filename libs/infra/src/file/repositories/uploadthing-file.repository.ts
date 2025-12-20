import { type IFileRepository, UploadInput } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { UTApi } from 'uploadthing/server';
import { PrismaTransactionalRepository } from '../../prisma/prisma-transactional.repository';

@Injectable()
export class UploadthingFileRepository implements IFileRepository {
  private utapi: UTApi;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly transactionalRepo: PrismaTransactionalRepository,
  ) {
    const token = process.env.UPLOADTHING_TOKEN;

    if (!token) {
      throw new Error(
        'UPLOADTHING_TOKEN (or UPLOADTHING_SECRET) environment variable not set',
      );
    }
    this.utapi = new UTApi({ token });
  }

  public async upload(input: UploadInput, tx?: Prisma.TransactionClient) {
    const run = async (DBtx: Prisma.TransactionClient) => {
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
        const created = await DBtx.file.create({
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
    };

    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepo.withTransaction(run);
    }
  }

  public async findById(id: string, tx?: Prisma.TransactionClient) {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return DBtx.file.findUnique({ where: { id } });
    };

    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepo.withTransaction(run);
    }
  }

  public async findByCode(code: number, tx?: Prisma.TransactionClient) {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return DBtx.file.findUnique({ where: { code } });
    };

    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepo.withTransaction(run);
    }
  }

  public async findAll(options?: unknown, tx?: Prisma.TransactionClient) {
    const run = async (DBtx: Prisma.TransactionClient) => {
      return DBtx.file.findMany(options as Prisma.FileFindManyArgs);
    };

    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepo.withTransaction(run);
    }
  }

  public async delete(id: string, tx?: Prisma.TransactionClient) {
    const run = async (DBtx: Prisma.TransactionClient) => {
      // First, get the file to extract the URL
      const file = await DBtx.file.findUnique({ where: { id } });

      if (!file) {
        return;
      }

      // Extract the file key from the UploadThing URL
      // UploadThing URLs are typically: https://utfs.io/f/<fileKey>
      const fileKey = this.extractFileKeyFromUrl(file.url);

      // Delete from UploadThing if we have a valid key
      if (fileKey) {
        try {
          await this.utapi.deleteFiles(fileKey);
        } catch (error) {
          // Log but don't fail if UploadThing deletion fails
          console.error(
            `Failed to delete file from UploadThing: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // Delete from database
      await DBtx.file.delete({ where: { id } });
    };

    if (tx) {
      return await run(tx);
    } else {
      return await this.transactionalRepo.withTransaction(run);
    }
  }

  /**
   * Extracts the file key from an UploadThing URL.
   * UploadThing URLs are typically formatted as: https://utfs.io/f/<fileKey>
   */
  private extractFileKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Handle utfs.io URLs: https://utfs.io/f/<fileKey>
      if (urlObj.hostname === 'utfs.io' && urlObj.pathname.startsWith('/f/')) {
        return urlObj.pathname.slice(3); // Remove '/f/' prefix
      }
      // Handle uploadthing.com URLs: https://<app>.uploadthing.com/<fileKey>
      if (urlObj.hostname.endsWith('uploadthing.com')) {
        return urlObj.pathname.slice(1); // Remove leading '/'
      }
      return null;
    } catch {
      return null;
    }
  }
}
