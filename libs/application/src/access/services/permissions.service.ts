import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import type { Permission } from '@app/domain';
import {
  PERMISSION_REPOSITORY,
  type CreatePermissionInput,
  type PermissionRepository,
} from '@app/domain';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissions: PermissionRepository,
  ) {}

  create(input: CreatePermissionInput): Promise<Permission> {
    return this.permissions.create(input);
  }

  async getById(id: string): Promise<Permission> {
    const permission = await this.permissions.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission', 'id', id);
    }
    return permission;
  }

  async getByKey(key: string): Promise<Permission> {
    const permissions = await this.permissions.findAll({ key });
    if (!permissions.length) {
      throw new NotFoundError('Permission', 'key', key);
    }
    return permissions[0];
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      Permission,
      Prisma.PermissionFindManyArgs,
      Prisma.PermissionWhereInput
    >({
      repo: this.permissions,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['name', 'key', 'description'],
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  async update(id: string, data: Permission): Promise<Permission> {
    const existing = await this.permissions.findById(id);
    if (!existing) {
      throw new NotFoundError('Permission', 'id', id);
    }
    try {
      return await this.permissions.update(id, { ...existing, ...data });
    } catch (e) {
      if ((e as { code?: unknown })?.code === 'P2025') {
        throw new NotFoundError('Permission', 'id', id);
      }
      throw e;
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.permissions.findById(id);
    if (!existing) {
      throw new NotFoundError('Permission', 'id', id);
    }
    try {
      await this.permissions.delete(id);
    } catch (e) {
      if ((e as { code?: unknown })?.code === 'P2025') {
        throw new NotFoundError('Permission', 'id', id);
      }
      throw e;
    }
  }
}
