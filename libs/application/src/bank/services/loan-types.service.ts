import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type {
  CreateLoanTypeInput,
  LoanType,
  UpdateLoanTypeInput,
} from '@app/domain';
import { PrismaLoanTypeRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoanTypesService {
  constructor(private readonly loanTypesRepo: PrismaLoanTypeRepository) {}

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      LoanType,
      Prisma.LoanTypeFindManyArgs,
      Prisma.LoanTypeWhereInput
    >({
      repo: this.loanTypesRepo,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['name'],
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<LoanType> {
    const loanType = await this.loanTypesRepo.findById(id, tx);
    if (!loanType) {
      throw new NotFoundError('LoanType', 'id', id);
    }
    return loanType;
  }

  async create(
    input: CreateLoanTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType> {
    return this.loanTypesRepo.create(input, tx);
  }

  async update(
    id: string,
    loanType: UpdateLoanTypeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanType> {
    const exists = await this.loanTypesRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('LoanType', 'id', id);
    }
    try {
      return await this.loanTypesRepo.update(id, loanType, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('LoanType', 'id', id);
      }
      throw e;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const exists = await this.loanTypesRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('LoanType', 'id', id);
    }
    try {
      await this.loanTypesRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('LoanType', 'id', id);
      }
      throw e;
    }
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }
}
