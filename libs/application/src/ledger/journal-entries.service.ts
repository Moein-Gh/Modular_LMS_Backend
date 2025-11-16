import { paginatePrisma } from '@app/application/common/pagination.util';
import {
  AllocationType,
  InstallmentStatus,
  Journal,
  JournalEntry,
  LedgerAccount,
  SubscriptionFeeStatus,
  TransactionStatus,
} from '@app/domain';
import {
  DebitCredit,
  JournalEntryTarget,
} from '@app/domain/ledger/entities/journal-entry.entity';
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
import { AddSingleJournalEntryDto } from './dto/add-single-journal-entry.dto';
import { GetJournalEntriesQueryDto } from './dto/get-journalEntries-query.dto';

@Injectable()
export class JournalEntriesService {
  constructor(
    @Inject('JournalEntryRepository')
    private readonly journalEntryRepository: PrismaJournalEntryRepository,
    @Inject('JournalRepository')
    private readonly journalRepository: PrismaJournalRepository,
    @Inject('LedgerAccountRepository')
    private readonly ledgerAccountRepository: PrismaLedgerAccountRepository,
    private readonly prismaTransactionalRepo: PrismaTransactionalRepository,
  ) {}

  // Convert a decimal amount string to integer minor units (scale=4)
  private toMinorUnits(amount: string, scale = 4): bigint {
    const neg = amount.startsWith('-');
    const s = neg ? amount.slice(1) : amount;
    const [intPart, fracPart = ''] = s.split('.');
    const fracPadded = (fracPart + '0'.repeat(scale)).slice(0, scale);
    const bi = BigInt((intPart || '0') + fracPadded);
    return neg ? -bi : bi;
  }

  async addSingleEntry(
    dto: AddSingleJournalEntryDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    const run = async (DBtx: Prisma.TransactionClient): Promise<Journal> => {
      // 1. Validate journal exists and is in PENDING status
      const journal = await this.journalRepository.findById(
        dto.journalId,
        DBtx,
      );
      if (!journal) {
        throw new NotFoundException(
          `Journal with id ${dto.journalId} not found`,
        );
      }
      if (journal.status !== JournalStatus.PENDING) {
        throw new ConflictException(
          `Cannot add entries to journal with status ${journal.status}. Only PENDING journals can be modified.`,
        );
      }
      // 2. get ledgerAccountId with code
      const ledgerAccounts = await this.ledgerAccountRepository.findAll(
        {},
        DBtx,
      );
      if (!ledgerAccounts || ledgerAccounts.length === 0) {
        throw new NotFoundException(`No Ledger Accounts found`);
      }
      let creditLedgerAccount: LedgerAccount | undefined;
      const debitLedgerAccount: LedgerAccount | undefined = ledgerAccounts.find(
        (la) => la.code === '2050',
      );
      switch (dto.allocationType) {
        case AllocationType.ACCOUNT_BALANCE:
          creditLedgerAccount = ledgerAccounts.find((la) => la.code === '2000');
          break;
        case AllocationType.LOAN_REPAYMENT:
          creditLedgerAccount = ledgerAccounts.find((la) => la.code === '1100');
          break;
        case AllocationType.SUBSCRIPTION_FEE:
          creditLedgerAccount = ledgerAccounts.find((la) => la.code === '2000');
          break;
        default:
          creditLedgerAccount = ledgerAccounts.find((la) => la.code === '2000');
      }
      // 3. Create the debit journal entry
      await this.journalEntryRepository.create(
        {
          journalId: dto.journalId,
          ledgerAccountId: debitLedgerAccount!.id,
          dc: DebitCredit.DEBIT,
          amount: dto.amount.toString(),
          removable: true,
        },
        DBtx,
      );
      // 4. Create the credit journal entry
      const creditJournalEntry = await this.journalEntryRepository.create(
        {
          journalId: dto.journalId,
          ledgerAccountId: creditLedgerAccount!.id,
          removable: true,
          dc: DebitCredit.CREDIT,
          amount: dto.amount.toString(),
          targetType: dto.targetType,
          targetId: dto.targetId,
        },
        DBtx,
      );
      // 5. (Optional) link journal entry to target entity
      if (dto.allocationType === AllocationType.LOAN_REPAYMENT) {
        await DBtx.installment.update({
          where: { id: dto.targetId },
          data: {
            journalEntryId: creditJournalEntry.id,
            status: InstallmentStatus.ALLOCATED,
          },
        });
      } else if (dto.allocationType === AllocationType.SUBSCRIPTION_FEE) {
        await DBtx.subscriptionFee.update({
          where: { id: dto.targetId },
          data: {
            journalEntryId: creditJournalEntry.id,
            status: SubscriptionFeeStatus.ALLOCATED,
          },
        });
      }

      // 6. Ensure account 2050 is balanced after new entries
      const isBalanced = await this.verifyAccountBalanced(
        dto.journalId,
        '2050',
        DBtx,
      );

      if (journal.transactionId) {
        await DBtx.transaction.update({
          where: { id: journal.transactionId },
          data: {
            status: isBalanced
              ? TransactionStatus.ALLOCATED
              : TransactionStatus.PENDING,
          },
        });
      }

      // 7. Return updated journal with entries
      const updatedJournal = await this.journalRepository.findByIdWithEntries(
        dto.journalId,
        DBtx,
      );
      if (!updatedJournal) {
        throw new NotFoundException(
          `Journal with id ${dto.journalId} not found after entry creation`,
        );
      }
      return updatedJournal;
    };
    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  async findAll(
    query?: GetJournalEntriesQueryDto,
    tx?: Prisma.TransactionClient,
  ) {
    const where: Prisma.JournalEntryWhereInput = {
      journalId: query?.journalId,
    };
    return paginatePrisma<
      JournalEntry,
      Prisma.JournalEntryFindManyArgs,
      Prisma.JournalEntryWhereInput
    >({
      where,
      repo: this.journalEntryRepository,
      query: query ?? new GetJournalEntriesQueryDto(),
      defaultOrderBy: 'createdAt',
      defaultOrderDir: 'desc',
      tx,
    });
  }

  async findOne(id: string, tx?: Prisma.TransactionClient) {
    const j = await this.journalEntryRepository.findById(id, tx);
    if (!j) throw new NotFoundException('JournalEntry not found');
    return j;
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const run = async (DBtx: Prisma.TransactionClient) => {
      const journalEntry = await this.journalEntryRepository.findById(id, DBtx);

      if (journalEntry?.removable === false) {
        throw new NotFoundException('این سند حسابداری قابل حذف نیست');
      }
      if (!journalEntry) {
        throw new NotFoundException('سند حسابداری پیدا نشد');
      }

      // if the target type is loan or subscription fee, we need to update the related entity
      if (journalEntry.targetType === JournalEntryTarget.INSTALLMENT) {
        // update the installment journalEntryId to null and status to PENDING
        await DBtx.installment.update({
          where: { id: journalEntry.targetId! },
          data: {
            journalEntryId: null,
            status: InstallmentStatus.ACTIVE,
          },
        });
      }
      if (journalEntry.targetType === JournalEntryTarget.SUBSCRIPTION_FEE) {
        await DBtx.subscriptionFee.update({
          where: { id: journalEntry.targetId! },
          data: {
            journalEntryId: null,
            status: SubscriptionFeeStatus.DUE,
          },
        });
      }

      await this.journalEntryRepository.delete(id, DBtx);

      // Ensure account 2050 is balanced after deletion
      const isBalanced = await this.verifyAccountBalanced(
        journalEntry.journalId,
        '2050',
        DBtx,
      );

      // Find the journal to get transactionId
      const journal = await this.journalRepository.findById(
        journalEntry.journalId,
        DBtx,
      );
      if (journal?.transactionId) {
        await DBtx.transaction.update({
          where: { id: journal.transactionId },
          data: {
            status: isBalanced
              ? TransactionStatus.ALLOCATED
              : TransactionStatus.PENDING,
          },
        });
      }

      return journalEntry;
    };
    return tx ? run(tx) : this.prismaTransactionalRepo.withTransaction(run);
  }

  private async verifyAccountBalanced(
    journalId: string,
    accountCode: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const entries = await this.journalRepository.findByIdWithEntries(
      journalId,
      tx,
    );

    if (!entries) {
      return false;
    }

    const lines: JournalEntry[] = entries.entries ?? [];

    const totalDebitMinor = lines
      .filter(
        (je: JournalEntry) =>
          je.ledgerAccount?.code === accountCode && je.dc === DebitCredit.DEBIT,
      )
      .reduce<bigint>(
        (sum: bigint, je: JournalEntry) => sum + this.toMinorUnits(je.amount),
        0n,
      );

    const totalCreditMinor = lines
      .filter(
        (je: JournalEntry) =>
          je.ledgerAccount?.code === accountCode &&
          je.dc === DebitCredit.CREDIT,
      )
      .reduce<bigint>(
        (sum: bigint, je: JournalEntry) => sum + this.toMinorUnits(je.amount),
        0n,
      );

    return totalDebitMinor === totalCreditMinor;
  }
}
