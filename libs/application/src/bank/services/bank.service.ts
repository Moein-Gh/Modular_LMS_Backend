import { NotFoundError } from '@app/application/errors/not-found.error';
import type { Bank } from '@app/domain';
import type {
  CreateBankInput,
  UpdateBankInput,
} from '@app/domain/bank/types/bank.type';
import {
  PrismaAccountRepository,
  PrismaAccountTypeRepository,
} from '@app/infra';
import { PrismaBankRepository } from '@app/infra/bank/repositories/prisma-bank.repository';
import type { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { BankAlreadyExistsError } from '../errors/bank-already-exists.error';
import { BankInvalidAccountError } from '../errors/bank-invalid-account.error';

@Injectable()
export class BankService {
  constructor(
    private readonly bankRepo: PrismaBankRepository,
    private readonly accountsRepo: PrismaAccountRepository,
    private readonly accountTypesRepo: PrismaAccountTypeRepository,
  ) {}

  async get(tx?: Prisma.TransactionClient): Promise<Bank> {
    const bank = await this.bankRepo.findOne(tx);
    if (!bank) {
      throw new NotFoundError('Bank', 'id', 'singleton');
    }
    return bank;
  }

  async bootstrap(
    input: CreateBankInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Bank> {
    const existing = await this.bankRepo.findOne(tx);
    if (existing) {
      throw new BankAlreadyExistsError();
    }

    // If accountId provided, validate account and its accountType name === 'bank'
    if (input.accountId) {
      const account = await this.accountsRepo.findUnique({
        where: { id: input.accountId },
      });
      if (!account) {
        throw new BankInvalidAccountError('Provided accountId does not exist');
      }

      const accountType = await this.accountTypesRepo.findById(
        account.accountTypeId,
      );
      if (!accountType || accountType.name.toLowerCase() !== 'bank') {
        throw new BankInvalidAccountError(
          'Account must have accountType with name "bank"',
        );
      }
    }

    return this.bankRepo.create(input, tx);
  }

  async update(
    id: string,
    input: UpdateBankInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Bank> {
    const existing = await this.bankRepo.findOne(tx);
    if (!existing || existing.id !== id) {
      throw new NotFoundError('Bank', 'id', id);
    }
    try {
      return await this.bankRepo.update(id, input, tx);
    } catch (e) {
      if ((e as { code?: unknown })?.code === 'P2025') {
        throw new NotFoundError('Bank', 'id', id);
      }
      throw e;
    }
  }
}
