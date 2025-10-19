import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type { Transaction } from '@app/domain';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@app/domain/transaction/types/transaction.type';
import { PrismaTransactionRepository, PrismaUserRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepo: PrismaTransactionRepository,
    private readonly usersRepo: PrismaUserRepository,
  ) {}

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      Transaction,
      Prisma.TransactionFindManyArgs,
      Prisma.TransactionWhereInput
    >({
      repo: this.transactionsRepo,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['externalRef', 'note'],
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const transaction = await this.transactionsRepo.findByIdWithRelations(
      id,
      tx,
    );
    if (!transaction) {
      throw new NotFoundError('Transaction', 'id', id);
    }
    return transaction;
  }

  async create(
    input: CreateTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    // check if user exists
    await this.checkUserExists(input.userId, tx);
    return this.transactionsRepo.create(input, tx);
  }

  async update(
    id: string,
    transaction: UpdateTransactionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Transaction> {
    const exists = await this.transactionsRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Transaction', 'id', id);
    }
    try {
      return await this.transactionsRepo.update(id, transaction, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Transaction', 'id', id);
      }
      throw e;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const exists = await this.transactionsRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Transaction', 'id', id);
    }
    try {
      await this.transactionsRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Transaction', 'id', id);
      }
      throw e;
    }
  }

  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  private async checkUserExists(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const user = await this.usersRepo.findById(userId, false, tx);
    if (!user || !user.isActive) {
      throw new NotFoundError('User', 'id', userId);
    }
    return true;
  }
}
