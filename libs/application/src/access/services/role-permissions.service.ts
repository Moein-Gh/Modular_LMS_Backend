import { NotFoundError } from '@app/application/errors/not-found.error';
import type { RolePermission } from '@app/domain';
import {
  PERMISSION_REPOSITORY,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  type CreateRolePermissionInput,
  type PermissionRepository,
  type RolePermissionRepository,
  type RoleRepository,
  type UpdateRolePermissionInput,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RolePermissionsService {
  constructor(
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissions: RolePermissionRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roles: RoleRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissions: PermissionRepository,
    private readonly transactionalRepo: PrismaTransactionalRepository,
  ) {}

  create(
    input: CreateRolePermissionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RolePermission> {
    const run = async (tx: Prisma.TransactionClient) => {
      // Validate role exists
      const role = await this.roles.findById(input.roleId, tx);
      if (!role) {
        throw new NotFoundError('Role', 'id', input.roleId);
      }

      // Validate permission exists
      const permission = await this.permissions.findById(
        input.permissionId,
        tx,
      );
      if (!permission) {
        throw new NotFoundError('Permission', 'id', input.permissionId);
      }

      return this.rolePermissions.create(input, tx);
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  getById(id: string, tx?: Prisma.TransactionClient): Promise<RolePermission> {
    const run = async (tx: Prisma.TransactionClient) => {
      const rolePermission = await this.rolePermissions.findById(id, tx);
      if (!rolePermission) {
        throw new NotFoundError('RolePermission', 'id', id);
      }
      return rolePermission;
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  findByRoleId(
    roleId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RolePermission[]> {
    const run = async (tx: Prisma.TransactionClient) => {
      return this.rolePermissions.findByRoleId(roleId, tx);
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  findByPermissionId(
    permissionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RolePermission[]> {
    const run = async (tx: Prisma.TransactionClient) => {
      return this.rolePermissions.findByPermissionId(permissionId, tx);
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  list(tx?: Prisma.TransactionClient): Promise<RolePermission[]> {
    const run = async (tx: Prisma.TransactionClient) => {
      return this.rolePermissions.list(tx);
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  update(
    id: string,
    data: UpdateRolePermissionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RolePermission> {
    const run = async (tx: Prisma.TransactionClient) => {
      const existing = await this.rolePermissions.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('RolePermission', 'id', id);
      }
      try {
        return await this.rolePermissions.update(id, data, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('RolePermission', 'id', id);
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (tx: Prisma.TransactionClient) => {
      const existing = await this.rolePermissions.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('RolePermission', 'id', id);
      }
      try {
        await this.rolePermissions.delete(id, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('RolePermission', 'id', id);
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }
}
