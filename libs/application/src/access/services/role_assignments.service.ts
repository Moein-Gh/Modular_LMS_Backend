import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import type { RoleAssignment } from '@app/domain';
import {
  type RoleAssignmentRepository,
  ROLE_ASSIGNMENT_REPOSITORY,
} from '@app/domain';
import { CreateRoleAssignmentInput } from '@app/domain/access/types/role-assignment.type';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RoleAssignmentsService {
  constructor(
    @Inject(ROLE_ASSIGNMENT_REPOSITORY)
    private readonly roleAssignment: RoleAssignmentRepository,
  ) {}

  create(
    input: CreateRoleAssignmentInput,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment> {
    return this.roleAssignment.create(input, tx);
  }

  async getById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment> {
    const roleAssignment = await this.roleAssignment.findById(id, tx);
    if (!roleAssignment) {
      throw new NotFoundError('RoleAssignment', 'id', id);
    }
    return roleAssignment;
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      RoleAssignment,
      Prisma.RoleAssignmentFindManyArgs,
      Prisma.RoleAssignmentWhereInput
    >({
      repo: this.roleAssignment,
      query: query ?? new PaginationQueryDto(),
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
      include: {
        role: true,
        user: { include: { identity: { select: { name: true } } } },
      },
    });
  }

  update(
    id: string,
    data: RoleAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<RoleAssignment> {
    return (async () => {
      const existing = await this.roleAssignment.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('RoleAssignment', 'id', id);
      }
      try {
        return await this.roleAssignment.update(id, data, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('RoleAssignment', 'id', id);
        }
        throw e;
      }
    })();
  }

  delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    return (async () => {
      const existing = await this.roleAssignment.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('RoleAssignment', 'id', id);
      }
      try {
        await this.roleAssignment.delete(id, tx);
      } catch (e) {
        if ((e as { code?: unknown })?.code === 'P2025') {
          throw new NotFoundError('RoleAssignment', 'id', id);
        }
        throw e;
      }
    })();
  }
}
