import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import type { PrismaClient, Prisma } from '@generated/prisma';
import {
  type PermissionRepository,
  type CreatePermissionInput,
  type UpdatePermissionInput,
  type ListPermissionsParams,
  type ListPermissionsResult,
} from '@app/domain';
import type { DomainPermission } from '@app/domain';

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

  async findById(id: string): Promise<DomainPermission | null> {
    const model = await this.prisma.permission.findUnique({
      where: { id },
      select: permissionSelect,
    });
    return model ? toDomain(model as PermissionModel) : null;
  }

  async findByKey(key: string): Promise<DomainPermission | null> {
    const model = await this.prisma.permission.findUnique({
      where: { key },
      select: permissionSelect,
    });
    return model ? toDomain(model as PermissionModel) : null;
  }

  async list(params: ListPermissionsParams): Promise<ListPermissionsResult> {
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

    const [items, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        skip,
        take,
        orderBy: order,
        select: permissionSelect,
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      items: items.map((i) => toDomain(i as PermissionModel)),
      total,
    };
  }

  async create(data: CreatePermissionInput): Promise<DomainPermission> {
    const created = await this.prisma.permission.create({
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
    data: UpdatePermissionInput,
  ): Promise<DomainPermission> {
    const updated = await this.prisma.permission.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: permissionSelect,
    });
    return toDomain(updated as PermissionModel);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }
}
