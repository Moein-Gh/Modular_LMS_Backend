import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import type { CreatePermissionGrantInput, PermissionGrant } from '@app/domain';
import {
  PERMISSION_GRANT_REPOSITORY,
  type PermissionGrantRepository,
  type UpdatePermissionGrantInput,
} from '@app/domain';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PermissionGrantsService {
  constructor(
    @Inject(PERMISSION_GRANT_REPOSITORY)
    private readonly permissionGrants: PermissionGrantRepository,
  ) {}

  create(input: CreatePermissionGrantInput): Promise<PermissionGrant> {
    return this.permissionGrants.create(input);
  }

  async getById(id: string): Promise<PermissionGrant> {
    const grant = await this.permissionGrants.findById(id);
    if (!grant) {
      throw new NotFoundError('PermissionGrant', 'id', id);
    }
    return grant;
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      PermissionGrant,
      Prisma.PermissionGrantFindManyArgs,
      Prisma.PermissionGrantWhereInput
    >({
      repo: this.permissionGrants,
      query: query ?? new PaginationQueryDto(),
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  update(
    id: string,
    data: UpdatePermissionGrantInput,
  ): Promise<PermissionGrant> {
    return (async () => {
      const existing = await this.permissionGrants.findById(id);
      if (!existing) {
        throw new NotFoundError('PermissionGrant', 'id', id);
      }
      try {
        return await this.permissionGrants.update(id, data);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('PermissionGrant', 'id', id);
        }
        throw e;
      }
    })();
  }

  delete(id: string): Promise<void> {
    return (async () => {
      const existing = await this.permissionGrants.findById(id);
      if (!existing) {
        throw new NotFoundError('PermissionGrant', 'id', id);
      }
      try {
        await this.permissionGrants.delete(id);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('PermissionGrant', 'id', id);
        }
        throw e;
      }
    })();
  }
}
