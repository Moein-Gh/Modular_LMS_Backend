import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import { JournalBalanceUsecase } from '@app/application/ledger/journal-balance.usecase';
import { User, USER_REPOSITORY, type IUserRepository } from '@app/domain';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUserInput } from '../types/create-user.type';
import { UpdateUserInput } from '../types/update-user.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly journalBalanceUseCase: JournalBalanceUsecase,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  async create(
    input: CreateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const created = await this.users.create(input, tx);
    return created;
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<User> {
    const user = await this.users.findById(id, tx);
    if (!user) {
      throw new NotFoundError('User', 'id', id);
    }
    const accountsBalance =
      await this.journalBalanceUseCase.getUserAccountsBalance(id, tx);

    const loansBalance = await this.journalBalanceUseCase.getUserLoansBalance(
      id,
      tx,
    );

    // Merge balances into a plain object so serialization includes it
    const result = {
      ...user,
      balanceSummary: {
        accounts: accountsBalance,
        loans: loansBalance,
      },
    } as unknown as User;

    return result;
  }

  async findByIdentityId(
    identityId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const users = await this.users.findAll({ where: { identityId } }, tx);
    if (!users.length) return null;
    return users[0];
  }

  async setActive(
    userId: string,
    isActive: boolean,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const existing = await this.users.findById(userId, tx);
    if (!existing) {
      throw new NotFoundError('User', 'id', userId);
    }
    try {
      await this.users.update(userId, { isActive }, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('User', 'id', userId);
      }
      throw e;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const run = async (trx: Prisma.TransactionClient) => {
      const existing = await this.users.findById(id, trx);
      if (!existing) {
        throw new NotFoundError('User', 'id', id);
      }
      // check if user has any accounts or transactions
      const accounts = await trx?.account.findMany({
        where: { userId: id },
      });
      if (accounts.length > 0) {
        throw new ConflictException(
          'کاربر دارای حساب های مالی است و نمی توان آن را حذف کرد',
        );
      }
      const transactions = await trx?.transaction.findMany({
        where: { userId: id },
      });
      if (transactions.length > 0) {
        throw new ConflictException(
          'کاربر دارای تراکنش های مالی است و نمی توان آن را حذف کرد',
        );
      }

      try {
        await this.users.delete(id, trx);
        // delete identity
        await trx.identity.delete({ where: { id: existing.identityId } });
      } catch (e) {
        if (this.isPrismaNotFoundError(e)) {
          throw new NotFoundError('User', 'id', id);
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<User, Prisma.UserFindManyArgs, Prisma.UserWhereInput>(
      {
        repo: this.users,
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
      },
    );
  }

  async update(
    id: string,
    input: UpdateUserInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const existing = await this.users.findById(id, tx);
    if (!existing) {
      throw new NotFoundError('User', 'id', id);
    }
    try {
      await this.users.update(id, input, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('User', 'id', id);
      }
      throw e;
    }
    return this.findById(id, tx);
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }
}
