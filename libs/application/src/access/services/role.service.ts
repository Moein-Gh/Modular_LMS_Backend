import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import type { Role } from '@app/domain';
import { ROLE_REPOSITORY, type RoleRepository } from '@app/domain';
import { CreateRoleInput } from '@app/domain/access/types/role.type';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  create(input: CreateRoleInput): Promise<Role> {
    return this.roles.create(input);
  }

  async getById(id: string): Promise<Role> {
    const role = await this.roles.findById(id);
    if (!role) {
      throw new NotFoundError('Role', 'id', id);
    }
    return role;
  }

  async getByKey(key: string): Promise<Role> {
    const roles = await this.roles.findAll({ key });
    if (!roles.length) {
      throw new NotFoundError('Role', 'key', key);
    }
    return roles[0];
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<Role, Prisma.RoleFindManyArgs, Prisma.RoleWhereInput>(
      {
        repo: this.roles,
        query: query ?? new PaginationQueryDto(),
        searchFields: ['name', 'key', 'description'],
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        tx,
      },
    );
  }

  update(id: string, data: Role): Promise<Role> {
    return (async () => {
      const existing = await this.roles.findById(id);
      if (!existing) {
        throw new NotFoundError('Role', 'id', id);
      }
      try {
        return await this.roles.update(id, data);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('Role', 'id', id);
        }
        throw e;
      }
    })();
  }

  delete(id: string): Promise<void> {
    return (async () => {
      const existing = await this.roles.findById(id);
      if (!existing) {
        throw new NotFoundError('Role', 'id', id);
      }
      try {
        await this.roles.delete(id);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('Role', 'id', id);
        }
        throw e;
      }
    })();
  }
}
