import { NotFoundError } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import {
  OrderDirection,
  type CreateInstallmentInput,
  type Installment,
  type ListInstallmentQueryInput,
  type UpdateInstallmentInput,
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

  async findAll(
    query?: ListInstallmentQueryInput,
    tx?: Prisma.TransactionClient,
  ) {
    const where: Prisma.InstallmentWhereInput = {};
    if (query?.loanId) {
      where.loanId = query.loanId;
    }
    if (query?.status !== undefined) {
      where.status = query.status;
    }
    if (query?.isDeleted !== undefined) {
      where.isDeleted = query.isDeleted;
    }

    return paginatePrisma<
      Installment,
      Prisma.InstallmentFindManyArgs,
      Prisma.InstallmentWhereInput
    >({
      repo: this.installmentsRepo,
      query: query || {},
      where,
      searchFields: ['loanId'],
      defaultOrderBy: query?.orderBy || 'dueDate',
      defaultOrderDir: query?.orderDir || OrderDirection.ASC,
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
    return this.installmentsRepo.update(id, input, tx);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const exists = await this.installmentsRepo.findById(id, tx);
    if (!exists) throw new NotFoundError('Installment', 'id', id);
    await this.installmentsRepo.softDelete(id, currentUserId, tx);
  }

  private async ensureLoanExists(
    loanId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const loan = await this.loansRepo.findOne({ where: { id: loanId } }, tx);
    if (!loan) throw new NotFoundError('Loan', 'id', loanId);
    return loan;
  }
}
