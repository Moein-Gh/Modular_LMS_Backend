import { NotFoundError, PaginationQueryDto } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import type {
  CreateLoanRequestInput,
  LoanRequest,
  UpdateLoanRequestInput,
} from '@app/domain';
import { LoanRequestStatus } from '@app/domain';
import {
  PrismaAccountRepository,
  PrismaLoanRepository,
  PrismaLoanRequestRepository,
  PrismaLoanTypeRepository,
} from '@app/infra';
import type { Prisma } from '@generated/prisma';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { LoansService } from './loans.service';

@Injectable()
export class LoanRequestsService {
  constructor(
    private readonly loanRequestRepo: PrismaLoanRequestRepository,
    private readonly loanTypeRepo: PrismaLoanTypeRepository,
    private readonly accountRepo: PrismaAccountRepository,
    private readonly loanRepo: PrismaLoanRepository,
    @Inject(forwardRef(() => LoansService))
    private readonly loansService: LoansService,
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
    // Special-case frontend ordering by friendly fields which map to
    // nested relation fields in Prisma. Prisma won't accept flat
    // `userName` or `accountName`, so build the paginated query manually.
    if (query?.orderBy === 'userName' || query?.orderBy === 'accountName') {
      const page = query?.page ?? 1;
      const pageSize = query?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const take = pageSize;
      const orderDir = (query?.orderDir as 'asc' | 'desc') ?? 'desc';

      const where: Prisma.LoanRequestWhereInput = {
        ...(query?.accountId && { accountId: query.accountId }),
        ...(query?.loanTypeId && { loanTypeId: query.loanTypeId }),
        ...(query?.userId && { userId: query.userId }),
        ...(query?.status && { status: query.status }),
        isDeleted: query?.isDeleted ?? false,
      };

      const include = {
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
      } as const;

      // Map friendly orderBy to nested Prisma orderBy
      const nestedOrderBy =
        query?.orderBy === 'userName'
          ? { user: { identity: { name: orderDir } } }
          : { account: { name: orderDir } };

      const [items, totalItems] = await Promise.all([
        this.loanRequestRepo.findAll(
          {
            where,
            include,
            skip,
            take,
            orderBy: nestedOrderBy,
          },
          tx,
        ),
        this.loanRequestRepo.count(where, tx),
      ]);

      return { items, totalItems, page, pageSize };
    }

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
    input: Omit<CreateLoanRequestInput, 'loanTypeId' | 'userId'>,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    // Validate loan type exists
    const loanTypeId = process.env.DEFAULT_LOAN_TYPE_ID;
    if (!loanTypeId) {
      throw new Error('Default loan type ID is not configured');
    }
    const loanType = await this.loanTypeRepo.findById(loanTypeId, tx);
    if (!loanType) {
      throw new NotFoundError('LoanType', 'id', loanTypeId);
    }

    // Validate account exists
    const account = await this.accountRepo.findById(input.accountId, {}, tx);
    if (!account) {
      throw new NotFoundError('Account', 'id', input.accountId);
    }

    // Check for active loans on this account
    const activeLoans = await this.loanRepo.findAll(
      {
        where: {
          accountId: input.accountId,
          status: 'ACTIVE',
          isDeleted: false,
        },
      },
      tx,
    );

    // If there's an active loan, validate start date is after last installment
    if (activeLoans && activeLoans.length > 0) {
      for (const activeLoan of activeLoans) {
        // Calculate the last installment date
        const lastInstallmentDate = new Date(activeLoan.startDate);
        lastInstallmentDate.setMonth(
          lastInstallmentDate.getMonth() + activeLoan.paymentMonths,
        );

        // Ensure new loan request starts after the last installment
        if (input.startDate <= lastInstallmentDate) {
          throw new Error(
            `The loan request start date must be after the last installment date (${lastInstallmentDate.toISOString().split('T')[0]}) of the existing active loan.`,
          );
        }
      }
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

    // Build final input with derived loanTypeId and userId
    const finalInput: CreateLoanRequestInput = {
      ...input,
      loanTypeId: loanTypeId,
      userId: account.userId,
    };

    return this.loanRequestRepo.create(finalInput, tx);
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

  async approve(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    const loanRequest = await this.loanRequestRepo.findById(id, tx);
    if (!loanRequest) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }

    if (loanRequest.status === LoanRequestStatus.APPROVED) {
      return loanRequest; // Already approved
    }

    if (loanRequest.status !== LoanRequestStatus.PENDING) {
      throw new Error(
        `Cannot approve loan request with status ${loanRequest.status}`,
      );
    }

    // Create loan from request using LoansService
    await this.loansService.create(
      {
        accountId: loanRequest.accountId,
        loanTypeId: loanRequest.loanTypeId,
        amount: loanRequest.amount,
        startDate: loanRequest.startDate,
        paymentMonths: loanRequest.paymentMonths,
        name: `Loan for request ${loanRequest.code}`,
      },
      tx,
    );

    // Update request status to APPROVED
    return this.update(id, { status: LoanRequestStatus.APPROVED }, tx);
  }

  async reject(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanRequest> {
    const loanRequest = await this.loanRequestRepo.findById(id, tx);
    if (!loanRequest) {
      throw new NotFoundError('LoanRequest', 'id', id);
    }

    if (loanRequest.status === LoanRequestStatus.REJECTED) {
      return loanRequest; // Already rejected
    }

    // Update request status to REJECTED
    return this.update(id, { status: LoanRequestStatus.REJECTED }, tx);
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
