import { NotFoundError } from '@app/application';
import {
  LoanRequestStatus,
  type CreateLoanQueueInput,
  type LoanQueue,
  type UpdateLoanQueueInput,
} from '@app/domain';
import {
  PrismaLoanQueueRepository,
  PrismaLoanRequestRepository,
} from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoanQueueService {
  constructor(
    private readonly loanQueueRepo: PrismaLoanQueueRepository,
    private readonly loanRequestRepo: PrismaLoanRequestRepository,
  ) {}

  async getQueue(tx?: Prisma.TransactionClient): Promise<LoanQueue[]> {
    return this.loanQueueRepo.findAll(
      {
        where: { isDeleted: false },
        orderBy: { queueOrder: 'asc' },
        include: {
          loanRequest: {
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
        },
      },
      tx,
    );
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    const queueItem = await this.loanQueueRepo.findOne(
      {
        where: { id, isDeleted: false },
        include: {
          loanRequest: {
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
        },
      },
      tx,
    );

    if (!queueItem) {
      throw new NotFoundError('LoanQueue', 'id', id);
    }

    return queueItem;
  }

  async addToQueue(
    input: CreateLoanQueueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    const loanRequest = await this.loanRequestRepo.findById(
      input.loanRequestId,
      tx,
    );
    if (!loanRequest) {
      throw new NotFoundError('LoanRequest', 'id', input.loanRequestId);
    }

    // Check if already in queue
    const existingQueue = await this.loanQueueRepo.findByLoanRequestId(
      input.loanRequestId,
      tx,
    );
    if (existingQueue) {
      throw new Error('Loan request is already in queue');
    }

    // Update loan request status
    await this.loanRequestRepo.update(
      input.loanRequestId,
      { status: LoanRequestStatus.IN_QUEUE },
      tx,
    );

    return this.loanQueueRepo.create(input, tx);
  }

  async updateOrder(
    id: string,
    newOrder: number,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    return this.loanQueueRepo.updateOrder(id, newOrder, tx);
  }

  async updateQueueItem(
    id: string,
    input: UpdateLoanQueueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<LoanQueue> {
    const exists = await this.loanQueueRepo.findOne({ where: { id } }, tx);
    if (!exists) {
      throw new NotFoundError('LoanQueue', 'id', id);
    }

    return this.loanQueueRepo.update(id, input, tx);
  }

  async removeFromQueue(
    loanRequestId: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const loanRequest = await this.loanRequestRepo.findById(loanRequestId, tx);
    if (!loanRequest) {
      throw new NotFoundError('LoanRequest', 'id', loanRequestId);
    }

    // Remove from queue
    await this.loanQueueRepo.removeFromQueue(loanRequestId, currentUserId, tx);

    // Update status back to pending
    await this.loanRequestRepo.update(
      loanRequestId,
      { status: LoanRequestStatus.PENDING },
      tx,
    );
  }

  async softDelete(
    id: string,
    currentUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const exists = await this.loanQueueRepo.findOne({ where: { id } }, tx);
    if (!exists) {
      throw new NotFoundError('LoanQueue', 'id', id);
    }

    await this.loanQueueRepo.softDelete(id, currentUserId, tx);
  }

  async restore(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    await this.loanQueueRepo.restore(id, tx);
  }
}
