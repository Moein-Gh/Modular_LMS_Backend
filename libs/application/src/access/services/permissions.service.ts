import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import type { Permission } from '@app/domain';
import {
  PERMISSION_REPOSITORY,
  type CreatePermissionInput,
  type PermissionRepository,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissions: PermissionRepository,
    private readonly transactionalRepo: PrismaTransactionalRepository,
  ) {}

  create(
    input: CreatePermissionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Permission> {
    const run = async (tx: Prisma.TransactionClient) => {
      return this.permissions.create(input, tx);
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  getById(id: string, tx?: Prisma.TransactionClient): Promise<Permission> {
    const run = async (tx: Prisma.TransactionClient) => {
      const permission = await this.permissions.findById(id, tx);
      if (!permission) {
        throw new NotFoundError('Permission', 'id', id);
      }
      return permission;
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  getByKey(key: string, tx?: Prisma.TransactionClient): Promise<Permission> {
    const run = async (tx: Prisma.TransactionClient) => {
      const permissions = await this.permissions.findAll({ key }, tx);
      if (!permissions.length) {
        throw new NotFoundError('Permission', 'key', key);
      }
      return permissions[0];
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    const run = async (tx: Prisma.TransactionClient) =>
      paginatePrisma<
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

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  update(
    id: string,
    data: Permission,
    tx?: Prisma.TransactionClient,
  ): Promise<Permission> {
    const run = async (tx: Prisma.TransactionClient) => {
      const existing = await this.permissions.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('Permission', 'id', id);
      }
      try {
        return await this.permissions.update(id, { ...existing, ...data }, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('Permission', 'id', id);
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (tx: Prisma.TransactionClient) => {
      const existing = await this.permissions.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('Permission', 'id', id);
      }
      try {
        await this.permissions.delete(id, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('Permission', 'id', id);
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }
}
