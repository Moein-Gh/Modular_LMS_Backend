import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient, Prisma } from '@generated/prisma';
import {
  type PermissionRepository,
  type CreatePermissionInput,
  type ListPermissionsParams,
} from '@app/domain';
import type { BaseListResult, DomainPermission } from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';

const permissionSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PermissionSelect;

type PermissionModel = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(model: PermissionModel): DomainPermission {
  return {
    id: model.id,
    key: model.key,
    name: model.name,
    description: model.description ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.permission.findUnique({
      where: { id },
      select: permissionSelect,
    });
    return model ? toDomain(model as PermissionModel) : null;
  }

  async findByKey(
    key: string,
    tx?: Prisma.TransactionClient,
  ): Promise<DomainPermission | null> {
    const prisma = tx ?? this.prisma;
    const model = await prisma.permission.findUnique({
      where: { key },
      select: permissionSelect,
    });
    return model ? toDomain(model as PermissionModel) : null;
  }

  async findAll(
    params: ListPermissionsParams,
    tx?: Prisma.TransactionClient,
  ): Promise<BaseListResult<DomainPermission>> {
    const prisma = tx ?? this.prisma;
    const {
      search,
      skip = 0,
      take = 20,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = params;

    const where: Prisma.PermissionWhereInput | undefined = search
      ? {
          OR: [
            { key: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const order: Prisma.PermissionOrderByWithRelationInput =
      orderBy === 'name'
        ? { name: orderDir }
        : orderBy === 'key'
          ? { key: orderDir }
          : { createdAt: orderDir };

    const items = await prisma.permission.findMany({
      where,
      skip,
      take,
      orderBy: order,
      select: permissionSelect,
    });

    const total = await prisma.permission.count({ where });

    return {
      items: items.map((i) => toDomain(i as PermissionModel)),
      total,
    };
  }

  async create(
    data: CreatePermissionInput,
    tx: Prisma.TransactionClient,
  ): Promise<DomainPermission> {
    const created = await tx.permission.create({
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
    data: DomainPermission,
    tx: Prisma.TransactionClient,
  ): Promise<DomainPermission> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: permissionSelect,
    });
    return toDomain(updated as PermissionModel);
  }

  async delete(id: string, tx: Prisma.TransactionClient): Promise<void> {
    await tx.permission.delete({ where: { id } });
  }
}
