import { NotFoundError } from '@app/application';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { DateService } from '@app/date';
import {
  type CreateSubscriptionFeeInput,
  type ListSubscriptionFeeQueryInput,
  type SubscriptionFee,
  type UpdateSubscriptionFeeInput,
  CreateNextSubscriptionFeeInput,
  OrderDirection,
  SubscriptionFeeStatus,
} from '@app/domain';
import {
  PrismaAccountRepository,
  PrismaSubscriptionFeeRepository,
} from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { BankService } from './banks.service';

@Injectable()
export class SubscriptionFeesService {
  constructor(
    private readonly subscriptionFeesRepo: PrismaSubscriptionFeeRepository,
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly bankService: BankService,
    private readonly dateService: DateService,
  ) {}

  async findAll(
    query?: ListSubscriptionFeeQueryInput,
    tx?: Prisma.TransactionClient,
  ) {
    const where: Prisma.SubscriptionFeeWhereInput = {};

    const conditions: Prisma.SubscriptionFeeWhereInput[] = [];

    if (query?.accountId) conditions.push({ accountId: query.accountId });
    if (query?.status) conditions.push({ status: query.status });
    if (query?.periodStart)
      conditions.push({ periodStart: query.periodStart as unknown as Date });
    if (query?.userId) conditions.push({ account: { userId: query.userId } });
    if (query?.isDeleted !== undefined)
      conditions.push({ isDeleted: query.isDeleted });

    if (conditions.length === 1) {
      Object.assign(where, conditions[0]);
    } else if (conditions.length > 1) {
      where.AND = conditions;
    }

    return paginatePrisma<
      SubscriptionFee,
      Prisma.SubscriptionFeeFindManyArgs,
      Prisma.SubscriptionFeeWhereInput
    >({
      repo: this.subscriptionFeesRepo,
      query: query ?? {},
      where,
      searchFields: ['accountId'],
      defaultOrderBy: 'periodStart',
      defaultOrderDir: query?.orderDir || OrderDirection.ASC,
      tx,
    });
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee> {
    const item = await this.subscriptionFeesRepo.findById(id, tx);
    if (!item) throw new NotFoundError('SubscriptionFee', 'id', id);
    return item;
  }

  async create(
    input: CreateSubscriptionFeeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee> {
    await this.ensureAccountExists(input.accountId, tx);
    const bank = await this.bankService.get();
    const baseAmount = bank.subscriptionFee || 0;
    return this.subscriptionFeesRepo.create(
      {
        ...input,
        amount: baseAmount.toString(),
        status: SubscriptionFeeStatus.DUE,
      },
      tx,
    );
  }

  async update(
    id: string,
    input: UpdateSubscriptionFeeInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SubscriptionFee> {
    const exists = await this.subscriptionFeesRepo.findById(id, tx);
    if (!exists) throw new NotFoundError('SubscriptionFee', 'id', id);

    return this.subscriptionFeesRepo.update(id, input, tx);
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const exists = await this.subscriptionFeesRepo.findById(id, tx);
    if (!exists) throw new NotFoundError('SubscriptionFee', 'id', id);
    await this.subscriptionFeesRepo.softDelete(id, currentUserId, tx);
  }

  private async ensureAccountExists(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const acc = await this.accountsRepo.findUnique(
      { where: { id: accountId } },
      tx,
    );
    if (!acc) throw new NotFoundError('Account', 'id', accountId);
    return acc;
  }

  async createNext(
    input: CreateNextSubscriptionFeeInput,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const lastFee = await this.findAll(
      {
        accountId: input.accountId,
        orderBy: 'periodStart',
        orderDir: OrderDirection.DESC,
        take: 1,
      },
      tx,
    );

    let nextPeriodStart: Date;
    if (lastFee.items.length === 0) {
      nextPeriodStart = this.dateService.startOfMonth(new Date());
    } else {
      const lastPeriodStart = lastFee.items[0].periodStart;
      nextPeriodStart = this.dateService.startOfMonth(
        this.dateService.addMonths(lastPeriodStart, 1),
      );
    }

    for (let i = 0; i < input.numberOfMonths; i++) {
      const periodStart = this.dateService.startOfMonth(
        this.dateService.addMonths(nextPeriodStart, i),
      );

      await this.create(
        {
          accountId: input.accountId,
          periodStart,
        },
        tx,
      );
    }
  }
}
