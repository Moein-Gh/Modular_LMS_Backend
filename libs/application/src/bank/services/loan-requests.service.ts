import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type {
  CreateLoanRequestInput,
  LoanRequest,
  LoanRequestStatus,
  UpdateLoanRequestInput,
} from '@app/domain';
import {
  PrismaAccountRepository,
  PrismaLoanRequestRepository,
  PrismaLoanTypeRepository,
} from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoanRequestsService {
  constructor(
    private readonly loanRequestRepo: PrismaLoanRequestRepository,
    private readonly loanTypeRepo: PrismaLoanTypeRepository,
    private readonly accountRepo: PrismaAccountRepository,
  ) {}

  async findAll(
    query?: PaginationQueryDto & {
      accountId?: string;
      userId?: string;
      loanTypeId?: string;
      status?: LoanRequestStatus;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return paginatePrisma<
      LoanRequest,
      Prisma.LoanRequestFindManyArgs,
      Prisma.LoanRequestWhereInput
    >({
      repo: this.loanRequestRepo,
      query: query ?? new PaginationQueryDto(),
      where: {
        ...(query?.accountId && { accountId: query.accountId }),
        ...(query?.loanTypeId && { loanTypeId: query.loanTypeId }),
        ...(query?.userId && { userId: query.userId }),
        ...(query?.status && { status: query.status }),
        isDeleted: query?.isDeleted ?? false,
      },
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      include: {
        loanType: { select: { id: true, name: true } },
        account: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                identity: { select: { id: true, name: true } },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            identity: { select: { id: true, name: true } },
          },
        },
        loanQueue: true,
      },
      tx,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    const loanRequest = await this.loanRequestRepo.findOne(
      {
        where: { id, isDeleted: false },
        include: {
          loanType: true,
          account: {
            include: {
              user: {
                include: {
                  identity: true,
                },
              },
            },
          },
          user: {
            include: {
              identity: true,
            },
          },
          loanQueue: true,
        },
      },
      tx,
    );

    if (!loanRequest) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }

    return loanRequest;
  }

  async create(
    input: CreateLoanRequestInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    // Validate loan type exists
    const loanType = await this.loanTypeRepo.findById(input.loanTypeId, tx);
    if (!loanType) {
      throw new NotFoundError('LoanType', 'id', input.loanTypeId);
    }

    // Validate account exists
    const account = await this.accountRepo.findById(input.accountId, {}, tx);
    if (!account) {
      throw new NotFoundError('Account', 'id', input.accountId);
    }

    // Validate installments range
    if (
      input.paymentMonths < loanType.minInstallments ||
      input.paymentMonths > loanType.maxInstallments
    ) {
      throw new Error(
        `Payment months must be between ${loanType.minInstallments} and ${loanType.maxInstallments}`,
      );
    }

    return this.loanRequestRepo.create(input, tx);
  }

  async update(
    id: string,
    input: UpdateLoanRequestInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    const exists = await this.loanRequestRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }

    return this.loanRequestRepo.update(id, input, tx);
  }

  async updateStatus(
    id: string,
    status: LoanRequestStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    return this.update(id, { status: status }, tx);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const exists = await this.loanRequestRepo.findById(id, tx);
    if (!exists) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }

    await this.loanRequestRepo.softDelete(id, currentUserId, tx);
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.loanRequestRepo.restore(id, tx);
  }
}
