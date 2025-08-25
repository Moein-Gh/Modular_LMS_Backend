import {
  CreateRoleAssignmentInput,
  DomainRoleAssignment,
  ListRoleAssignmentsParams,
  ListRoleAssignmentsResult,
  RoleAssignmentRepository,
  UpdateRoleAssignmentInput,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.module';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@generated/prisma';
import type { DomainUser, DomainRole } from '@app/domain';

const roleAssignmentSelect: Prisma.RoleAssignmentSelect = {
  id: true,
  userId: true,
  roleId: true,
  assignedBy: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
};

type RoleAssignmentModel = {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
};

// Minimal models for included relations
type UserModel = {
  id: string;
  email: string;
  isActive: boolean;
};

type RoleModel = {
  id: string;
  name: string;
  key: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDomainUser(model: UserModel): DomainUser {
  return {
    id: model.id,
    email: model.email,
    isActive: model.isActive,
  };
}

function toDomainRole(model: RoleModel): DomainRole {
  return {
    id: model.id,
    name: model.name,
    key: model.key,
    description: model.description ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

function toDomain(
  model: RoleAssignmentModel & { user?: UserModel; role?: RoleModel },
): DomainRoleAssignment {
  return {
    id: model.id,
    userId: model.userId,
    roleId: model.roleId,
    assignedBy: model.assignedBy,
    expiresAt: model.expiresAt,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    isActive: model.isActive,
    user: model.user ? toDomainUser(model.user) : undefined,
    role: model.role ? toDomainRole(model.role) : undefined,
  };
}

@Injectable()
export class PrismaRoleAssignmentRepository
  implements RoleAssignmentRepository
{
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClient) {}
  async findById(id: string): Promise<DomainRoleAssignment | null> {
    try {
      const model = await this.prisma.roleAssignment.findUnique({
        where: { id },
        select: roleAssignmentSelect,
      });
      return model ? toDomain(model as RoleAssignmentModel) : null;
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

  async create(data: CreateRoleAssignmentInput): Promise<DomainRoleAssignment> {
    const created = await this.prisma.roleAssignment.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
        assignedBy: data.assignedBy ?? null,
        expiresAt: data.expiresAt ?? null,
        isActive: true,
      },
      select: roleAssignmentSelect,
    });
    return toDomain(created as RoleAssignmentModel);
  }

  async list(
    params: ListRoleAssignmentsParams,
  ): Promise<ListRoleAssignmentsResult> {
    const { userId, skip, take, orderBy, orderDir, includeUser, includeRole } =
      params;

    const where: Prisma.RoleAssignmentWhereInput = {
      ...(userId ? { userId } : {}),
    };

    const orderByClause:
      | Prisma.RoleAssignmentOrderByWithRelationInput
      | undefined = orderBy
      ? { [orderBy]: orderDir === 'desc' ? 'desc' : 'asc' }
      : undefined;

    const include: Prisma.RoleAssignmentInclude = {};
    if (includeUser) {
      include.user = {
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      };
    }
    if (includeRole) {
      include.role = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.roleAssignment.findMany({
        where,
        skip,
        take,
        orderBy: orderByClause,
        include: Object.keys(include).length > 0 ? include : undefined,
      }),
      this.prisma.roleAssignment.count({ where }),
    ]);

    return {
      items: items.map((i) => toDomain(i as RoleAssignmentModel)),
      total,
    };
  }

  async update(
    id: string,
    data: UpdateRoleAssignmentInput,
  ): Promise<DomainRoleAssignment> {
    const updated = await this.prisma.roleAssignment.update({
      where: { id },
      data: {
        assignedBy: data.assignedBy ?? null,
        expiresAt: data.expiresAt ?? null,
      },
      select: roleAssignmentSelect,
    });
    return toDomain(updated as RoleAssignmentModel);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.roleAssignment.delete({
      where: { id },
    });
  }
}
