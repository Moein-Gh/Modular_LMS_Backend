import { NotFoundError } from '@app/application';
import type { Role } from '@app/domain';
import {
  type CreateRoleInput,
  type RoleRepository,
  type UpdateRoleInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

// Use a structural type that matches the Prisma Role model
type RoleModel = {
  id: string;
  key: string;
  code: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | undefined;
  deletedBy: string | undefined;
};

const roleSelect = {
  id: true,
  key: true,
  name: true,
  code: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RoleSelect;

function toDomain(model: RoleModel): Role {
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
export class PrismaRoleRepository implements RoleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Role | null> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const model = await prisma.role.findUnique({
      where: { id, isDeleted: false },
      select: roleSelect,
    });
    return model ? toDomain(model as RoleModel) : null;
  }

  public async findAll(
    options: Prisma.RoleFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Role[]> {
    const prisma = tx ?? this.prisma;
    const { include, where, ...rest } = options ?? {};
    const args: Prisma.RoleFindManyArgs = {
      ...(include ? { include } : { select: roleSelect }),
      where: { isDeleted: false, ...(where as object) },
      ...rest,
    };
    const roles = await prisma.role.findMany(args);
    return roles.map((r) => toDomain(r as RoleModel));
  }

  async count(
    where?: Prisma.RoleWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    return prisma.role.count({ where: { isDeleted: false, ...where } });
  }

  async create(
    data: CreateRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Role> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const created = await prisma.role.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
      },
      select: roleSelect,
    });
    return toDomain(created as RoleModel);
  }

  async update(
    id: string,
    data: UpdateRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Role> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Role', 'id', id);
    }
    const updated = await prisma.role.update({
      where: { isDeleted: false, id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: roleSelect,
    });
    return toDomain(updated as RoleModel);
  }

  async softDelete(
    id: string,
    CurrentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Role', 'id', id);
    }
    await prisma.role.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: CurrentUserId,
      },
    });
  }
}
