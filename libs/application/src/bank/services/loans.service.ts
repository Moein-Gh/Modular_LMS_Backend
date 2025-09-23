import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type { CreateLoanInput, Loan, UpdateLoanInput } from '@app/domain';
import { PrismaLoanRepository, PrismaLoanTypeRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepo: PrismaLoanRepository,
    private readonly loanTypeRepo: PrismaLoanTypeRepository,
  ) {}

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<Loan, Prisma.LoanFindManyArgs, Prisma.LoanWhereInput>(
      {
        repo: this.loansRepo,
        query: query ?? new PaginationQueryDto(),
        searchFields: ['name'],
        defaultOrderBy: 'createdAt',
        defaultOrderDir: 'desc',
        tx,
      },
    );
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<Loan> {
    const loan = await this.loansRepo.findById(id, tx);
    if (!loan) {
      throw new NotFoundError('Loan', 'id', id);
    }
    return loan;
  }

  async create(
    input: CreateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    await this.validateLoanTypeId(input.loanTypeId, tx);

    return this.loansRepo.create(input, tx);
  }

  async update(
    id: string,
    loan: UpdateLoanInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Loan> {
    const exists = await this.loansRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Loan', 'id', id);
    }
    try {
      return await this.loansRepo.update(id, loan, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Loan', 'id', id);
      }
      throw e;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const exists = await this.loansRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('Loan', 'id', id);
    }
    try {
      await this.loansRepo.delete(id, tx);
    } catch (e) {
      if (this.isPrismaNotFoundError(e)) {
        throw new NotFoundError('Loan', 'id', id);
      }
      throw e;
    }
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }

  private async validateLoanTypeId(
    loanTypeId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const loanType = await this.loanTypeRepo.findById(loanTypeId, tx);
    if (!loanType) {
      throw new NotFoundError('LoanType', 'id', loanTypeId);
    }
    return loanType;
  }
}
