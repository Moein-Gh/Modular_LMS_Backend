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
      where: { id },
      select: roleSelect,
    });
    return model ? toDomain(model as RoleModel) : null;
  }

  public async findAll(
    options: Prisma.RoleFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<Role[]> {
    const prisma = tx ?? this.prisma;
    const roles = await prisma.role.findMany(options);
    return roles.map((r) => toDomain(r as RoleModel));
  }

  async count(
    where?: Prisma.RoleWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    return prisma.role.count({ where });
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
    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: roleSelect,
    });
    return toDomain(updated as RoleModel);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = (tx ?? this.prisma) as PrismaService;
    await prisma.role.delete({ where: { id } });
  }
}
