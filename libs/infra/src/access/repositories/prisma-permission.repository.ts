import { NotFoundError } from '@app/application';
import type { Permission } from '@app/domain';
import {
  type CreatePermissionInput,
  type PermissionRepository,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const permissionSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  code: true,
} satisfies Prisma.PermissionSelect;

type PermissionModel = {
  id: string;
  key: string;
  name: string;
  code: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
};

function toDomain(model: PermissionModel): Permission {
  return {
    id: model.id,
    key: model.key,
    code: model.code,
    name: model.name,
    description: model.description ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    isDeleted: model.isDeleted,
    deletedAt: model.deletedAt ?? undefined,
    deletedBy: model.deletedBy ?? undefined,
  };
}

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Permission | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.permission.findUnique({
      where: { id, isDeleted: false },
      select: permissionSelect,
    });
    return model ? toDomain(model as PermissionModel) : null;
  }

  async findByKey(
    key: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Permission | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.permission.findUnique({
      where: { key, isDeleted: false },
      select: permissionSelect,
    });
    return model ? toDomain(model as PermissionModel) : null;
  }

  async findAll(
    options?: Prisma.PermissionFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Permission[]> {
    const prisma = tx ?? this.prisma;
    const { include, where, ...rest } = options ?? {};
    const args: Prisma.PermissionFindManyArgs = {
      ...(include ? { include } : { select: permissionSelect }),
      where: { isDeleted: false, ...(where as object) },
      ...rest,
    };
    const items = await prisma.permission.findMany(args);

    return items.map((m) => toDomain(m as PermissionModel));
  }

  async count(
    where?: Prisma.PermissionWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.permission.count({ where: { isDeleted: false, ...where } });
  }

  async create(
    data: CreatePermissionInput,
    tx: Prisma.TransactionClient,
  ): Promise<Permission> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.permission.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
      },
      select: permissionSelect,
    });
    return toDomain(created as PermissionModel);
  }

  async update(
    id: string,
    data: Permission,
    tx: Prisma.TransactionClient,
  ): Promise<Permission> {
    const prisma = tx ?? this.prisma;
    const existing = await prisma.permission.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Permission', 'id', id);
    }
    const updated = await prisma.permission.update({
      where: { isDeleted: false, id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: permissionSelect,
    });
    return toDomain(updated as PermissionModel);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const existing = await tx.permission.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Permission', 'id', id);
    }
    await tx.permission.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentUserId,
      },
    });
  }
}
