import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import {
  PaginatedResponse,
  paginatePrisma,
} from '@app/application/common/pagination.util';
import { NotFoundError } from '@app/application/errors/not-found.error';
import { JournalBalanceUsecase } from '@app/application/ledger/journal-balance.usecase';
import { DateService } from '@app/date';
import {
  Installment,
  InstallmentStatus,
  SubscriptionFee,
  SubscriptionFeeStatus,
  User,
  USER_REPOSITORY,
  UserStatus,
} from '@app/domain';
import {
  PrismaInstallmentRepository,
  PrismaSubscriptionFeeRepository,
  PrismaUserRepository,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { CreateUserInput } from '../types/create-user.type';
import {
  GetUpcomingPaymentsQueryDto,
  MonthlyPaymentDto,
  PaymentItemDto,
  PaymentStatus,
  PaymentType,
  UpcomingPaymentsResponseDto,
} from '../types/upcoming-payments.type';
import { UpdateUserInput } from '../types/update-user.type';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly usersRepo: PrismaUserRepository,
    private readonly journalBalanceUseCase: JournalBalanceUsecase,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly installmentRepo: PrismaInstallmentRepository,
    private readonly subscriptionFeeRepo: PrismaSubscriptionFeeRepository,
    private readonly dateService: DateService,
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

  // Get user's upcoming payments grouped by Persian month
  async getUserUpcomingPayments(
    userId: string,
    query: GetUpcomingPaymentsQueryDto,
    tx?: Prisma.TransactionClient,
  ): Promise<UpcomingPaymentsResponseDto> {
    if (tx) {
      // Verify user exists
      const user = await this.usersRepo.findById(userId, tx);
      if (!user) {
        throw new NotFoundError('User', 'id', userId);
      }

      // Fetch all installments for user's loans
      const installments = await this.installmentRepo.findAll(
        {
          where: {
            loan: {
              userId,
            },
          },
          include: {
            loan: {
              include: {
                account: true,
              },
            },
            journalEntry: {
              include: {
                journal: {
                  include: {
                    transaction: true,
                  },
                },
              },
            },
          },
        },
        tx,
      );

      // Fetch all subscription fees for user's accounts
      const subscriptionFees = await this.subscriptionFeeRepo.findAll(
        {
          where: {
            account: {
              userId,
            },
          },
          include: {
            account: true,
            journalEntry: {
              include: {
                journal: {
                  include: {
                    transaction: true,
                  },
                },
              },
            },
          },
        },
        tx,
      );

      const now = new Date();

      // Map installments to payment items
      const installmentPayments: PaymentItemDto[] = installments.map(
        (inst: Installment) => {
          const isPaid = inst.status === InstallmentStatus.PAID;
          return {
            id: inst.id,
            type: PaymentType.INSTALLMENT,
            amount: inst.amount,
            status: isPaid ? PaymentStatus.PAID : PaymentStatus.NOT_PAID,
            dueDate: inst.dueDate,
            paymentDate: inst.paymentDate,
            transactionId: inst.journalEntry?.journal?.transactionId,
            loanId: inst.loanId,
            loanName: inst.loan?.name,
            installmentNumber: inst.installmentNumber,
          };
        },
      );

      // Map subscription fees to payment items
      const subscriptionPayments: PaymentItemDto[] = subscriptionFees.map(
        (fee: SubscriptionFee) => {
          const isPaid = fee.status === SubscriptionFeeStatus.PAID;
          return {
            id: fee.id,
            type: PaymentType.SUBSCRIPTION_FEE,
            amount: fee.amount,
            status: isPaid ? PaymentStatus.PAID : PaymentStatus.NOT_PAID,
            dueDate: fee.dueDate ?? fee.periodStart,
            paymentDate: fee.paidAt,
            transactionId: fee.journalEntry?.journal?.transactionId,
            accountId: fee.accountId,
            accountName: fee.account?.name,
            periodStart: fee.periodStart,
          };
        },
      );

      // Combine all payments
      const allPayments = [...installmentPayments, ...subscriptionPayments];

      // Group payments by Persian month
      const monthsMap = new Map<string, PaymentItemDto[]>();

      allPayments.forEach((payment) => {
        const dueDate = payment.dueDate;
        const monthKey = this.dateService
          .formatPersianDate(dueDate, 'yyyy/MM/dd' as any)
          .substring(0, 7); // Get yyyy/MM part
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, []);
        }
        monthsMap.get(monthKey)!.push(payment);
      });

      // Convert map to array and calculate totals
      const monthlyPayments: MonthlyPaymentDto[] = [];
      for (const [monthKey, items] of monthsMap.entries()) {
        const [year, month] = monthKey.split('/').map(Number);
        const firstDayOfMonth = this.dateService.parsePersianDate(
          `${year}/${month.toString().padStart(2, '0')}/01`,
          'yyyy/MM/dd',
        );
        const lastDayOfMonth = this.dateService.endOfMonth(firstDayOfMonth);
        // Extract only the Persian month name (e.g., "فروردین")
        const monthName = this.dateService.formatPersianDate(
          firstDayOfMonth,
          'MMMM' as any,
        );

        const total = items.reduce(
          (sum, item) => sum + parseFloat(item.amount),
          0,
        );
        const totalPaid = items
          .filter((item) => item.status === PaymentStatus.PAID)
          .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalUnpaid = items
          .filter((item) => item.status === PaymentStatus.NOT_PAID)
          .reduce((sum, item) => sum + parseFloat(item.amount), 0);

        monthlyPayments.push({
          month: monthKey,
          monthName,
          year,
          monthNumber: month,
          lastDayOfMonth,
          lastDayOfMonthPersian: this.dateService.formatPersianDate(
            lastDayOfMonth,
            'yyyy/MM/dd' as any,
          ),
          items,
          total: this.formatAmount(total),
          totalPaid: this.formatAmount(totalPaid),
          totalUnpaid: this.formatAmount(totalUnpaid),
        });
      }

      // Sort months chronologically
      monthlyPayments.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNumber - b.monthNumber;
      });

      // Separate into past and upcoming
      const upcomingMonths: MonthlyPaymentDto[] = [];
      const pastMonths: MonthlyPaymentDto[] = [];

      monthlyPayments.forEach((monthData) => {
        const hasUnpaidItems = monthData.items.some(
          (item) => item.status === PaymentStatus.NOT_PAID,
        );
        const isCurrentOrFuture =
          this.dateService.isAfter(monthData.lastDayOfMonth, now) ||
          this.dateService.isSameMonth(monthData.lastDayOfMonth, now);

        if (isCurrentOrFuture) {
          upcomingMonths.push(monthData);
        } else {
          // Past month
          if (hasUnpaidItems) {
            // Always include if has unpaid items
            upcomingMonths.push(monthData);
          } else if (query.includePastPaid) {
            // Include only if query requests it
            pastMonths.push(monthData);
          }
        }
      });

      // Calculate grand totals
      const grandTotal = allPayments.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0,
      );
      const totalPaid = allPayments
        .filter((item) => item.status === PaymentStatus.PAID)
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const totalUnpaid = allPayments
        .filter((item) => item.status === PaymentStatus.NOT_PAID)
        .reduce((sum, item) => sum + parseFloat(item.amount), 0);

      return {
        upcomingMonths,
        pastMonths,
        grandTotal: this.formatAmount(grandTotal),
        totalPaid: this.formatAmount(totalPaid),
        totalUnpaid: this.formatAmount(totalUnpaid),
      };
    }

    return this.prismaTransactionalRepo.withTransaction((t) =>
      this.getUserUpcomingPayments(userId, query, t),
    );
  }

  // Format numeric amounts: round to 4 decimals then trim trailing zeros
  private formatAmount(value: number): string {
    const rounded = Math.round((value + Number.EPSILON) * 10000) / 10000;
    const str = rounded.toString();
    if (!str.includes('.')) return str;
    return str.replace(/\. ?0+$/, '').replace(/\.\s*$/, '');
  }

  // Narrowly detect Prisma's "Record not found" without importing Prisma types
  private isPrismaNotFoundError(e: unknown): boolean {
    const code = (e as { code?: unknown })?.code;
    return code === 'P2025';
  }
}
