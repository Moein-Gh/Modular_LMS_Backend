import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type {
  CreateInstallmentInput,
  Installment,
  UpdateInstallmentInput,
} from '@app/domain';
import { PrismaInstallmentRepository, PrismaLoanRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InstallmentsService {
  constructor(
    private readonly installmentsRepo: PrismaInstallmentRepository,
    private readonly loansRepo: PrismaLoanRepository,
  ) {}

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      Installment,
      Prisma.InstallmentFindManyArgs,
      Prisma.InstallmentWhereInput
    >({
      repo: this.installmentsRepo,
      query: query ?? new PaginationQueryDto(),
      searchFields: ['loanId'],
      defaultOrderBy: 'dueDate',
      defaultOrderDir: 'asc',
      tx,
    });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const inst = await this.installmentsRepo.findById(id, tx);
    if (!inst) throw new NotFoundError('Installment', 'id', id);
    return inst;
  }

  async create(input: CreateInstallmentInput, tx?: Prisma.TransactionClient) {
    await this.ensureLoanExists(input.loanId, tx);
    return this.installmentsRepo.create(input, tx);
  }

  async update(
    id: string,
    input: UpdateInstallmentInput,
    tx?: Prisma.TransactionClient,
  ) {
    const exists = await this.installmentsRepo.findById(id, tx);
    if (!exists) throw new NotFoundError('Installment', 'id', id);
    if (input.loanId) await this.ensureLoanExists(input.loanId, tx);
    return this.installmentsRepo.update(id, input, tx);
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const exists = await this.installmentsRepo.findById(id, tx);
    if (!exists) throw new NotFoundError('Installment', 'id', id);
    await this.installmentsRepo.delete(id, tx);
  }

  private async ensureLoanExists(
    loanId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const loan = await this.loansRepo.findById(loanId, tx);
    if (!loan) throw new NotFoundError('Loan', 'id', loanId);
    return loan;
  }
}
