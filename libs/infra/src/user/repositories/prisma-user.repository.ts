import {
  CreateUserInput,
  NotFoundError,
  UpdateUserInput,
} from '@app/application';
import {
  RoleAssignmentStatus,
  UserStatus,
  type Identity,
  type IUserRepository,
  type Role,
  type RoleAssignment,
  type User,
} from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { PrismaService } from '@app/infra/prisma/prisma.service';
import type { Prisma, PrismaClient } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

const userRelationsInclude = {
  identity: true,
  roleAssignments: {
    include: {
      role: true,
    },
  },
} as const;

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClient,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  public async count(
    where?: Prisma.UserWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx ?? this.prisma;
    return prisma.user.count({ where: where });
  }

  public async update(
    id: string,
    input: UpdateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;

    const updated = await prisma.user.update({
      where: { id },
      data: input,
    });
    return this.toDomain(
      updated as Prisma.UserGetPayload<{
        include: typeof userRelationsInclude;
      }>,
    );
  }

  public async create(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;

    const user = await prisma.user.create({
      data: {
        identityId: input.identityId,
        status: UserStatus.ACTIVE,
      },
    });
    return this.toDomain(
      user as Prisma.UserGetPayload<{ include: typeof userRelationsInclude }>,
    );
  }

  public async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findUnique({
      where: { id },
      include: userRelationsInclude,
    });
    if (!user) return null;
    return this.toDomain(user);
  }

  public async setActive(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });
  }

  public async findByIdentityId(
    identityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findUnique({
      where: { identityId },
      include: userRelationsInclude,
    });
    if (!user) return null;
    return this.toDomain(user);
  }

  public async findAll(
    options: Prisma.UserFindManyArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<User[]> {
    const prisma = tx ?? this.prisma;
    const users = await prisma.user.findMany(options);
    return users.map((user) =>
      this.toDomain(
        user as Prisma.UserGetPayload<{ include: typeof userRelationsInclude }>,
      ),
    );
  }

  async softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const user = await DBtx.user.findUnique({ where: { id } });
      await DBtx.identity.delete({ where: { id: user?.identityId } });
      await DBtx.user.delete({ where: { id } });
    };

    if (tx) return run(tx);
    return this.prismaTransactionalRepo.withTransaction(run);
  }

  public async findActiveUserOrThrow(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;
    const user = await prisma.user.findUnique({
      where: { id, status: UserStatus.ACTIVE },
      include: userRelationsInclude,
    });
    if (!user) {
      throw new NotFoundError('User', 'id', id);
    }
    return this.toDomain(user);
  }

  private toDomain(
    user: Prisma.UserGetPayload<{ include: typeof userRelationsInclude }>,
  ): User {
    return {
      id: user.id,
      code: user.code,
      identityId: user.identityId,
      status: user.status as UserStatus,
      isDeleted: user.isDeleted,
      identity: user.identity ? this.mapIdentity(user.identity) : undefined,
      roleAssignments: user.roleAssignments
        ? user.roleAssignments.map((assignment) =>
            this.mapRoleAssignment(
              assignment as Prisma.RoleAssignmentGetPayload<{
                include: { role: true };
              }>,
            ),
          )
        : undefined,
    };
  }

  private mapIdentity(identity: Prisma.IdentityGetPayload<object>): Identity {
    return {
      id: identity.id,
      phone: identity.phone,
      name: identity.name,
      countryCode: identity.countryCode,
      email: identity.email,
      isDeleted: identity.isDeleted,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    };
  }

  private mapRole(model: Prisma.RoleGetPayload<object>): Role {
    return {
      id: model.id,
      code: model.code,
      name: model.name,
      key: model.key,
      isDeleted: model.isDeleted,
      description: model.description ?? undefined,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  private mapRoleAssignment(
    assignment: Prisma.RoleAssignmentGetPayload<{ include: { role: true } }>,
  ): RoleAssignment {
    return {
      id: assignment.id,
      userId: assignment.userId,
      roleId: assignment.roleId,
      assignedBy: assignment.assignedBy ?? undefined,
      expiresAt: assignment.expiresAt ?? undefined,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      status: assignment.status as RoleAssignmentStatus,
      isDeleted: assignment.isDeleted,
      role: assignment.role ? this.mapRole(assignment.role) : undefined,
    };
  }
}
