import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import {
  PaginatedResponse,
  paginatePrisma,
} from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import { JournalBalanceUsecase } from '@app/application/ledger/journal-balance.usecase';
import { User, USER_REPOSITORY, UserStatus } from '@app/domain';
import { PrismaUserRepository } from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { CreateUserInput } from '../types/create-user.type';
import { UpdateUserInput } from '../types/update-user.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly usersRepo: PrismaUserRepository,
    private readonly journalBalanceUseCase: JournalBalanceUsecase,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async create(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    if (tx) {
      const created = await this.usersRepo.create(input, tx);
      return created;
    }
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.create(input, t),
    );
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<User> {
    if (tx) {
      const user = await this.usersRepo.findById(id, tx);
      if (!user) {
        throw new NotFoundError('User', 'id', id);
      }
      const accountsBalance =
        await this.journalBalanceUseCase.getUserAccountsBalance(id, tx);

      const loansBalance = await this.journalBalanceUseCase.getUserLoansBalance(
        id,
        tx,
      );

      const result = {
        ...user,
        balanceSummary: {
          accounts: accountsBalance,
          loans: loansBalance,
        },
      } as unknown as User;

      return result;
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findById(id, t),
    );
  }

  async findByIdentityId(
    identityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    if (tx) return await this.usersRepo.findByIdentityId(identityId, tx);
    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findByIdentityId(identityId, t),
    );
  }

  async setActive(
    userId: string,
    status: UserStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (tx) {
      const existing = await this.usersRepo.findById(userId, tx);
      if (!existing) {
        throw new NotFoundError('User', 'id', userId);
      }
      try {
        await this.usersRepo.update(userId, { status }, tx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('User', 'id', userId);
        }
        throw e;
      }
      return;
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.setActive(userId, status, t),
    );
  }

  async findAll(
    query?: PaginationQueryDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaginatedResponse<User>> {
    if (tx) {
      return paginatePrisma<
        User,
        Prisma.UserFindManyArgs,
        Prisma.UserWhereInput
      >({
        repo: this.usersRepo,
        query: query ?? new PaginationQueryDto(),
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        tx,
        include: {
          identity: true,
          roleAssignments: {
            include: {
              role: { select: { id: true, name: true } },
            },
          },
        },
        where: { isDeleted: query?.isDeleted },
      });
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.findAll(query, t),
    );
  }

  async update(
    id: string,
    input: UpdateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    if (tx) {
      const existing = await this.usersRepo.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('User', 'id', id);
      }
      try {
        await this.usersRepo.update(id, input, tx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('User', 'id', id);
        }
        throw e;
      }
      return this.findById(id, tx);
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.update(id, input, t),
    );
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (tx) {
      const existing = await this.usersRepo.findById(id, tx);
      if (!existing) {
        throw new NotFoundError('User', 'id', id);
      }
      try {
        await this.usersRepo.softDelete(id, currentUserId, tx);
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('User', 'id', id);
        }
        throw e;
      }
      return;
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.softDelete(id, currentUserId, t),
    );
  }

  // restore a soft-deleted user
  async restore(id: string, tx?: Prisma.TransactionClient): Promise<User> {
    if (tx) {
      return await this.usersRepo.restore(id, tx);
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.restore(id, t),
    );
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }
}
