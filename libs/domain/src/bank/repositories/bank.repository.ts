import { Prisma } from '@generated/prisma';
import { Bank } from '../entities/bank.entity';
import { CreateBankInput, UpdateBankInput } from '../types/bank.type';

export interface BankRepository {
  findOne(tx?: Prisma.TransactionClient): Promise<Bank | null>;
  create(input: CreateBankInput, tx?: Prisma.TransactionClient): Promise<Bank>;
  update(
    id: string,
    input: UpdateBankInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Bank>;
}
