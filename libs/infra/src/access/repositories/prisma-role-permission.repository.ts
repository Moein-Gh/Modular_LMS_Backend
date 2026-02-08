import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import type { RolePermission } from '../../../../domain/src/access/entities/role-permission.entity';

import { RolePermissionRepository } from '@app/domain';
import type {
  CreateRolePermissionInput,
  UpdateRolePermissionInput,
} from '../../../../domain/src/access/types/role-permission.type';

const rolePermissionInclude = {
  role: true,
  permission: true,
} as const;

type RolePermissionModel = Prisma.RolePermissionGetPayload<{
  include: typeof rolePermissionInclude;
}>;

function toDomain(model: RolePermissionModel): RolePermission {
  return {
    id: model.id,
    roleId: model.roleId,
    permissionId: model.permissionId,
    role: model.role
      ? {
          id: model.role.id,
          code: model.role.code,
          key: model.role.key,
          name: model.role.name,
          description: model.role.description ?? undefined,
          isDeleted: model.role.isDeleted,
          createdAt: model.role.createdAt,
          updatedAt: model.role.updatedAt,
        }
      : undefined,
    permission: model.permission
      ? {
          id: model.permission.id,
          code: model.permission.code,
          key: model.permission.key,
          name: model.permission.name,
          description: model.permission.description ?? undefined,
          isDeleted: model.permission.isDeleted,
          createdAt: model.permission.createdAt,
          updatedAt: model.permission.updatedAt,
        }
      : undefined,
    createdAt: model.createdAt,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
  } as RolePermission;
}

@Injectable()
export class PrismaRolePermissionRepository
  implements RolePermissionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRolePermissionInput): Promise<RolePermission> {
    const created = await this.prisma.rolePermission.create({
      data: {
        roleId: input.roleId,
        permissionId: input.permissionId,
      },
      include: rolePermissionInclude,
    });
    return toDomain(created as RolePermissionModel);
  }

  async findById(id: string): Promise<RolePermission | null> {
    const model = await this.prisma.rolePermission.findUnique({
      where: { id },
      include: rolePermissionInclude,
    });
    return model ? toDomain(model as RolePermissionModel) : null;
  }

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    const items = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: rolePermissionInclude,
    });
    return items.map((m) => toDomain(m as RolePermissionModel));
  }

  async findByPermissionId(permissionId: string): Promise<RolePermission[]> {
    const items = await this.prisma.rolePermission.findMany({
      where: { permissionId },
      include: rolePermissionInclude,
    });
    return items.map((m) => toDomain(m as RolePermissionModel));
  }

  async list(): Promise<RolePermission[]> {
    const items = await this.prisma.rolePermission.findMany({
      include: rolePermissionInclude,
    });
    return items.map((m) => toDomain(m as RolePermissionModel));
  }

  async update(
    id: string,
    update: Partial<UpdateRolePermissionInput>,
  ): Promise<RolePermission> {
    const updated = await this.prisma.rolePermission.update({
      where: { id },
      data: {
        roleId: update.roleId ?? undefined,
        permissionId: update.permissionId ?? undefined,
      },
      include: rolePermissionInclude,
    });
    return toDomain(updated as RolePermissionModel);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rolePermission.delete({ where: { id } });
  }
}
