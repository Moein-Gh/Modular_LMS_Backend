import { PaginationQueryDto } from '@app/application/common/dto/pagination-query.dto';
import { paginatePrisma } from '@app/application/common/pagination.util';
import { LedgerAccount } from '@app/domain';
import { PrismaLedgerAccountRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateLedgerAccountDto } from './dto/create-ledger-account.dto';
import type { UpdateLedgerAccountDto } from './dto/update-ledger-account.dto';

@Injectable()
export class LedgerAccountsService {
  constructor(
    @Inject('LedgerAccountRepository')
    private readonly ledgerAccountsRepo: PrismaLedgerAccountRepository,
  ) {}

  async create(dto: CreateLedgerAccountDto) {
    const existing = await this.ledgerAccountsRepo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException('Account code already exists');
    }
    return this.ledgerAccountsRepo.create(dto);
  }

  async findAll(query?: PaginationQueryDto, tx?: Prisma.TransactionClient) {
    return paginatePrisma<
      LedgerAccount,
      Prisma.LedgerAccountFindManyArgs,
      Prisma.LedgerAccountWhereInput
    >({
      repo: this.ledgerAccountsRepo,
      query: query ?? new PaginationQueryDto(),
      defaultOrderBy: 'code',
      defaultOrderDir: 'asc',
      tx,
      where: { isDeleted: query?.isDeleted },
    });
  }

  async findOne(id: string) {
    const acc = await this.ledgerAccountsRepo.findById(id);
    if (!acc) throw new NotFoundException('Ledger account not found');
    return acc;
  }

  async update(id: string, dto: UpdateLedgerAccountDto) {
    const existing = await this.ledgerAccountsRepo.findById(id);
    if (!existing) throw new NotFoundException('Ledger account not found');
    return this.ledgerAccountsRepo.update(id, dto);
  }

  async remove(id: string) {
    const existing = await this.ledgerAccountsRepo.findById(id);
    if (!existing) throw new NotFoundException('Ledger account not found');
    await this.ledgerAccountsRepo.delete(id);
  }
}
