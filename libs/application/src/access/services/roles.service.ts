import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import type { Role } from '@app/domain';
import {
  ROLE_ASSIGNMENT_REPOSITORY,
  ROLE_REPOSITORY,
  RoleAssignmentStatus,
  type RoleAssignmentRepository,
  type RoleRepository,
} from '@app/domain';
import { CreateRoleInput } from '@app/domain/access/types/role.type';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly roleAssignmentsRepo: RoleAssignmentRepository,
  ) {}

  create(input: CreateRoleInput): Promise<Role> {
    return this.roles.create(input);
  }

  async getById(id: string, tx?: Prisma.TransactionClient): Promise<Role> {
    const role = await this.roles.findById(id, tx);
    if (!role) {
      throw new NotFoundError('Role', 'id', id);
    }
    return role;
  }

  async getByKey(key: string, tx?: Prisma.TransactionClient): Promise<Role> {
    const roles = await this.roles.findAll({ key }, tx);
    if (!roles.length) {
      throw new NotFoundError('Role', 'key', key);
    }
    return roles[0];
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    const page = await paginatePrisma<
      Role,
      Prisma.RoleFindManyArgs,
      Prisma.RoleWhereInput
    >({
      repo: this.roles,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['name', 'key', 'description'],
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });

    // Enrich each role with `userCount` (number of active role assignments)
    const roleIds = page.items.map((r) => r.id);
    if (roleIds.length === 0) return page;

    // Fetch assignments for all roles on the page in one query
    const assignments = await this.roleAssignmentsRepo.findAll(
      {
        where: { roleId: { in: roleIds }, status: RoleAssignmentStatus.ACTIVE },
      },
      tx,
    );

    // Count assignments per roleId
    const counts = new Map<string, number>();
    for (const a of assignments) {
      counts.set(a.roleId, (counts.get(a.roleId) ?? 0) + 1);
    }

    const items = page.items.map((r) => {
      r.userCount = counts.get(r.id) ?? 0;
      return r;
    });

    return { ...page, items };
  }

  update(id: string, data: Role, tx?: Prisma.TransactionClient): Promise<Role> {
    return (async () => {
      const existing = await this.roles.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('Role', 'id', id);
      }
      try {
        return await this.roles.update(id, data, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('Role', 'id', id);
        }
        throw e;
      }
    })();
  }

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    return (async () => {
      const existing = await this.roles.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('Role', 'id', id);
      }
      try {
        await this.roles.delete(id, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('Role', 'id', id);
        }
        throw e;
      }
    })();
  }
}
