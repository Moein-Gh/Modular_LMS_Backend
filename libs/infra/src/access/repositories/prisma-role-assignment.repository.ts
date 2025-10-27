import type { Role, User } from '@app/domain';
import {
  CreateRoleAssignmentInput,
  RoleAssignment,
  RoleAssignmentRepository,
} from '@app/domain';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { PrismaClient } from '@generated/prisma';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

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

type UserModel = {
  id: string;
  code: number;
  identityId: string;
  isActive: boolean;
};

type RoleModel = {
  id: string;
  name: string;
  key: string;
  code: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDomainUser(model: UserModel): User {
  return {
    id: model.id,
    code: model.code,
    identityId: model.identityId,
    isActive: model.isActive,
  };
}

function toDomainRole(model: RoleModel): Role {
  return {
    id: model.id,
    name: model.name,
    key: model.key,
    code: model.code,
    description: model.description ?? undefined,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

function toDomain(
  model: RoleAssignmentModel & { user?: UserModel; role?: RoleModel },
): RoleAssignment {
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

  async findById(
    id: string,
    tx: Prisma.TransactionClient,
  ): Promise<RoleAssignment | null> {
    const prisma = tx ?? this.prisma;
    try {
      const model = await prisma.roleAssignment.findUnique({
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

  async create(
    data: CreateRoleAssignmentInput,
    tx: Prisma.TransactionClient,
  ): Promise<RoleAssignment> {
    const prisma = tx ?? this.prisma;
    const created = await prisma.roleAssignment.create({
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

  async findAll(
    options: Prisma.RoleAssignmentFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment[]> {
    const prisma = tx ?? this.prisma;
    const roleAssignments = await prisma.roleAssignment.findMany(options);
    return roleAssignments.map((m) => toDomain(m as RoleAssignmentModel));
  }

  async count(
    where?: Prisma.RoleAssignmentWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.roleAssignment.count({ where });
  }

  async update(
    id: string,
    data: RoleAssignment,
    tx: Prisma.TransactionClient,
  ): Promise<RoleAssignment> {
    const prisma = tx ?? this.prisma;
    const updated = await prisma.roleAssignment.update({
      where: { id },
      data: {
        assignedBy: data.assignedBy ?? null,
        expiresAt: data.expiresAt ?? null,
      },
      select: roleAssignmentSelect,
    });
    return toDomain(updated as RoleAssignmentModel);
  }

  async delete(id: string, tx: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.roleAssignment.delete({
      where: { id },
    });
  }
}
