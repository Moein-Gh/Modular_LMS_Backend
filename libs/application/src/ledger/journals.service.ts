import { Journal } from '@app/domain';
import { JournalStatus } from '@app/domain/ledger/entities/journal.entity';
import { PrismaJournalRepository } from '@app/infra';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginatePrisma } from '../common/pagination.util';
import type { CreateJournalDto } from './dto/create-journal.dto';
import type { GetJournalsQueryDto } from './dto/get-journals-query.dto';

@Injectable()
export class JournalsService {
  constructor(
    @Inject('JournalRepository')
    private readonly journalRepository: PrismaJournalRepository,
  ) {}

  async create(dto: CreateJournalDto) {
    return this.journalRepository.create({
      transactionId: dto.transactionId,
      postedAt: dto.postedAt ? new Date(dto.postedAt) : new Date(),
      note: dto.note,
      status: dto.status ?? JournalStatus.POSTED,
    });
  }

  async findOne(id: string, includeEntries = false) {
    const j = includeEntries
      ? await this.journalRepository.findByIdWithEntries(id)
      : await this.journalRepository.findById(id);

    if (!j) throw new NotFoundException('Journal not found');
    return j;
  }

  async findAll(query?: GetJournalsQueryDto, tx?: Prisma.TransactionClient) {
    const includeEntries = query?.includeEntries ?? false;

    // If including entries, we need to use a different repository method
    if (includeEntries) {
      return this.findAllWithEntries(query, tx);
    }

    return paginatePrisma<
      Journal,
      Prisma.JournalFindManyArgs,
      Prisma.JournalWhereInput
    >({
      repo: this.journalRepository,
      query: query ?? new PaginationQueryDto(),
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  private async findAllWithEntries(
    query?: GetJournalsQueryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.JournalWhereInput = {};

    if (query?.search) {
      whereConditions.note = { contains: query.search, mode: 'insensitive' };
    }

    const [items, totalItems] = await Promise.all([
      this.journalRepository.findAllWithEntries(
        {
          where: whereConditions,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        },
        tx,
      ),
      this.journalRepository.count(whereConditions, tx),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
    };
  }

  async remove(id: string) {
    const j = await this.journalRepository.findById(id);
    if (!j) throw new NotFoundException('Journal not found');
    await this.journalRepository.delete(id);
  }
}
