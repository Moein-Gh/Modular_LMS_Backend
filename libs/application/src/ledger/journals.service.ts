import { Journal } from '@app/domain';
import { DebitCredit } from '@app/domain/ledger/entities/journal-entry.entity';
import { JournalStatus } from '@app/domain/ledger/entities/journal.entity';
import {
  PrismaJournalEntryRepository,
  PrismaJournalRepository,
  PrismaLedgerAccountRepository,
} from '@app/infra';
import { PrismaTransactionalRepository } from '@app/infra/prisma/prisma-transactional.repository';
import { Prisma } from '@generated/prisma';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginatePrisma } from '../common/pagination.util';
import type { AddSingleJournalEntryDto } from './dto/add-single-journal-entry.dto';
import type { CreateJournalDto } from './dto/create-journal.dto';
import type { GetJournalsQueryDto } from './dto/get-journals-query.dto';

@Injectable()
export class JournalsService {
  constructor(
    @Inject('JournalRepository')
    private readonly journalRepository: PrismaJournalRepository,
    @Inject('JournalEntryRepository')
    private readonly journalEntryRepository: PrismaJournalEntryRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
    private readonly ledgerAccountRepository: PrismaLedgerAccountRepository,
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

    const where: Prisma.JournalWhereInput = {};

    if (query?.search) {
      where.note = { contains: query.search, mode: 'insensitive' };
    }

    if (query?.transactionId) {
      where.transactionId = query?.transactionId;
    }

    return paginatePrisma<
      Journal,
      Prisma.JournalFindManyArgs,
      Prisma.JournalWhereInput
    >({
      repo: this.journalRepository,
      where,
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
    if (query?.transactionId) {
      whereConditions.transactionId = query?.transactionId;
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

  async void(id: string, tx?: Prisma.TransactionClient) {
    const j = await this.journalRepository.findById(id, tx);
    if (!j) throw new NotFoundException('Journal not found');

    if (j.status === JournalStatus.VOIDED) {
      throw new ConflictException('Journal is already voided');
    }

    return this.journalRepository.update(
      id,
      { status: JournalStatus.VOIDED },
      tx,
    );
  }

  async remove(id: string, tx?: Prisma.TransactionClient) {
    const j = await this.journalRepository.findById(id, tx);
    if (!j) throw new NotFoundException('Journal not found');
    await this.journalRepository.delete(id);
  }

  async addSingleEntry(
    journalId: string,
    dto: AddSingleJournalEntryDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    const run = async (DBtx: Prisma.TransactionClient): Promise<Journal> => {
      // 1. Validate journal exists and is in PENDING status
      const journal = await this.journalRepository.findById(journalId, DBtx);
      if (!journal) {
        throw new NotFoundException(`Journal with id ${journalId} not found`);
      }

      if (journal.status !== JournalStatus.PENDING) {
        throw new ConflictException(
          `Cannot add entries to journal with status ${journal.status}. Only PENDING journals can be modified.`,
        );
      }

      // 2. get ledgerAccountId with code

      const ledgerAccounts = await this.ledgerAccountRepository.findAll(
        { where: { code: dto.ledgerAccountCode.toString() } },
        DBtx,
      );

      console.log('🚀 -----------------------------------🚀');
      console.log('🚀 ~ ledgerAccounts:', ledgerAccounts);
      console.log('🚀 -----------------------------------🚀');

      if (!ledgerAccounts || ledgerAccounts.length === 0) {
        throw new NotFoundException(
          `Ledger account with code ${dto.ledgerAccountCode} not found`,
        );
      }

      const ledgerAccountId = ledgerAccounts[0].id;

      // 3. Create the primary journal entry
      await this.journalEntryRepository.create(
        {
          journalId,
          ledgerAccountId,
          dc: dto.dc,
          amount: dto.amount.toString(),
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
        DBtx,
      );

      // 4. If targetLedgerAccountCode is provided, create balancing entry
      if (dto.targetLedgerAccountCode) {
        const targetLedgerAccounts = await this.ledgerAccountRepository.findAll(
          { where: { code: dto.targetLedgerAccountCode.toString() } },
          DBtx,
        );

        if (!targetLedgerAccounts || targetLedgerAccounts.length === 0) {
          throw new NotFoundException(
            `Target ledger account with code ${dto.targetLedgerAccountCode} not found`,
          );
        }

        const targetLedgerAccountId = targetLedgerAccounts[0].id;

        // Create opposite entry (DEBIT <-> CREDIT)
        const oppositeDc =
          dto.dc === DebitCredit.DEBIT ? DebitCredit.CREDIT : DebitCredit.DEBIT;

        await this.journalEntryRepository.create(
          {
            journalId,
            ledgerAccountId: targetLedgerAccountId,
            dc: oppositeDc,
            amount: dto.amount.toString(),
            targetType: dto.targetType,
            targetId: dto.targetId,
          },
          DBtx,
        );
      }

      // 5. Update journal note if provided
      if (dto.note) {
        await this.journalRepository.update(
          journalId,
          { note: dto.note },
          DBtx,
        );
      }

      // 6. Return updated journal with entries
      return this.findOne(journalId, true);
    };

    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }
}
