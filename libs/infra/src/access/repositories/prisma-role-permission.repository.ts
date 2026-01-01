import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import type { RolePermission } from '../../../../domain/src/access/entities/role-permission.entity';

import { RolePermissionRepository } from '@app/domain';
import type {
  CreateRolePermissionInput,
  UpdateRolePermissionInput,
} from '../../../../domain/src/access/types/role-permission.type';

const rolePermissionSelect: Prisma.RolePermissionSelect = {
  id: true,
  roleId: true,
  permissionId: true,
  createdAt: true,
};

type RolePermissionModel = Prisma.RolePermissionGetPayload<{
  select: typeof rolePermissionSelect;
}>;

function toDomain(model: RolePermissionModel): RolePermission {
  return {
    id: model.id,
    roleId: model.roleId,
    permissionId: model.permissionId,
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
      select: rolePermissionSelect,
    });
    return toDomain(created as RolePermissionModel);
  }

  async findById(id: string): Promise<RolePermission | null> {
    const model = await this.prisma.rolePermission.findUnique({
      where: { id },
      select: rolePermissionSelect,
    });
    return model ? toDomain(model as RolePermissionModel) : null;
  }

  async findByRoleId(roleId: string): Promise<RolePermission[]> {
    const items = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: rolePermissionSelect,
    });
    return items.map((m) => toDomain(m as RolePermissionModel));
  }

  async findByPermissionId(permissionId: string): Promise<RolePermission[]> {
    const items = await this.prisma.rolePermission.findMany({
      where: { permissionId },
      select: rolePermissionSelect,
    });
    return items.map((m) => toDomain(m as RolePermissionModel));
  }

  async list(): Promise<RolePermission[]> {
    const items = await this.prisma.rolePermission.findMany({
      select: rolePermissionSelect,
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
      select: rolePermissionSelect,
    });
    return toDomain(updated as RolePermissionModel);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.rolePermission.delete({ where: { id } });
  }
}
