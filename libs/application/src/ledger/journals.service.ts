import { JournalStatus } from '@app/domain/ledger/entities/journal.entity';
import { PrismaJournalRepository } from '@app/infra';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateJournalDto } from './dto/create-journal.dto';

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

  async findOne(id: string) {
    const j = await this.journalRepository.findById(id);
    if (!j) throw new NotFoundException('Journal not found');
    return j;
  }

  async list() {
    return this.journalRepository.list({ orderBy: { postedAt: 'desc' } });
  }

  async remove(id: string) {
    const j = await this.journalRepository.findById(id);
    if (!j) throw new NotFoundException('Journal not found');
    await this.journalRepository.delete(id);
  }
}
