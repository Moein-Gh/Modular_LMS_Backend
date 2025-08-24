import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import type { PrismaClient } from '@generated/prisma';
import { Prisma } from '@generated/prisma';
import {
  type RoleRepository,
  type CreateRoleInput,
  type UpdateRoleInput,
  type ListRolesParams,
  type ListRolesResult,
} from '@app/domain';
import type { DomainRole } from '@app/domain';

// Use a structural type that matches the Prisma Role model
type RoleModel = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const roleSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RoleSelect;

function toDomain(model: RoleModel): DomainRole {
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
export class PrismaRoleRepository implements RoleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<DomainRole | null> {
    try {
      const model = await this.prisma.role.findUnique({
        where: { id },
        select: roleSelect,
      });
      return model ? toDomain(model as RoleModel) : null;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2023'
      ) {
        // Invalid UUID → treat as not found, service will map to 404
        return null;
      }
      throw e;
    }
  }

  async findByKey(key: string): Promise<DomainRole | null> {
    const model = await this.prisma.role.findUnique({
      where: { key },
      select: roleSelect,
    });
    return model ? toDomain(model as RoleModel) : null;
  }

  async list(params: ListRolesParams): Promise<ListRolesResult> {
    const {
      search,
      skip = 0,
      take = 20,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = params;

    const where: Prisma.RoleWhereInput | undefined = search
      ? {
          OR: [
            { key: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const order: Prisma.RoleOrderByWithRelationInput =
      orderBy === 'name'
        ? { name: orderDir }
        : orderBy === 'key'
          ? { key: orderDir }
          : { createdAt: orderDir };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        orderBy: order,
        select: roleSelect,
      }),
      this.prisma.role.count({ where }),
    ]);

    return { items: items.map((i) => toDomain(i as RoleModel)), total };
  }

  async create(data: CreateRoleInput): Promise<DomainRole> {
    const created = await this.prisma.role.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
      },
      select: roleSelect,
    });
    return toDomain(created as RoleModel);
  }

  async update(id: string, data: UpdateRoleInput): Promise<DomainRole> {
    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: roleSelect,
    });
    return toDomain(updated as RoleModel);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }
}
