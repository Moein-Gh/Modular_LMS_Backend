import { TransactionalRepository } from '@app/domain/common/transactional-repository.interface';
import { Prisma } from '@generated/prisma';
import { DebitCredit } from '../entities/journal-entry.entity';
import { Journal, JournalStatus } from '../entities/journal.entity';
import { UnbalancedJournalError } from '../errors/unbalanced-journal.error';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import { JournalRepository } from '../repositories/journal.repository';
import { LedgerAccountRepository } from '../repositories/ledger-account.repository';

type possibleTargetTypes =
  | 'INSTALLMENT'
  | 'LOAN'
  | 'SUBSCRIPTION_FEE'
  | 'ACCOUNT'
  | 'FEE'
  | 'COMMISSION'
  | 'ADJUSTMENT'
  | 'REFUND'
  | 'REVERSAL';

export interface JournalEntrySpec {
  ledgerAccountCode: string;
  amount: string;
  dc: DebitCredit;
  targetType?: possibleTargetTypes;
  targetId?: string;
}

export class CreateJournalWithEntriesUseCase {
  constructor(
    private readonly journalRepo: JournalRepository,
    private readonly journalEntryRepo: JournalEntryRepository,
    private readonly ledgerAccountRepo: LedgerAccountRepository,
    private readonly transactionalRepo: TransactionalRepository,
  ) {}

  async execute(
    transactionId: string,
    entries: JournalEntrySpec[],
    tx?: Prisma.TransactionClient,
  ): Promise<Journal> {
    // Validate entries are balanced before creating
    this.validateBalancedEntries(entries);

    const run = async (trx: Prisma.TransactionClient) => {
      // 1. Create journal
      const journal = await this.journalRepo.create(
        {
          transactionId,
          status: JournalStatus.PENDING,
        },
        trx,
      );

      // 2. Fetch all required ledger accounts in parallel
      const accountCodes = entries.map((entry) => entry.ledgerAccountCode);
      const accounts = await Promise.all(
        accountCodes.map((code) =>
          this.ledgerAccountRepo.findByCode(code, trx),
        ),
      );

      // 3. Build account code to account ID map and validate all accounts exist
      const accountMap = new Map<string, string>();
      accountCodes.forEach((code, index) => {
        const account = accounts[index];
        if (!account) {
          throw new Error(`Ledger account with code '${code}' not found`);
        }
        accountMap.set(code, account.id);
      });

      // 4. Create all journal entries using batch insert
      const journalEntries = entries.map((entry) => ({
        journalId: journal.id,
        ledgerAccountId: accountMap.get(entry.ledgerAccountCode)!,
        amount: entry.amount,
        dc: entry.dc,
        targetType: entry.targetType,
        targetId: entry.targetId,
      }));

      await this.journalEntryRepo.createMany(journalEntries, trx);

      // 5. Return the created journal
      return journal;
    };

    // Use provided transaction or create a new one
    return tx ? run(tx) : this.transactionalRepo.withTransaction(run);
  }

  /**
   * Validates that journal entries are balanced (total debits = total credits).
   * This is a fundamental accounting rule that must be enforced at the domain level.
   */
  private validateBalancedEntries(entries: JournalEntrySpec[]): void {
    let debitTotal = 0;
    let creditTotal = 0;

    for (const entry of entries) {
      const amount = parseFloat(entry.amount);
      if (isNaN(amount)) {
        throw new Error(`Invalid amount: ${entry.amount}`);
      }

      if (entry.dc === DebitCredit.DEBIT) {
        debitTotal += amount;
      } else {
        creditTotal += amount;
      }
    }

    // Compare with precision (accounting typically uses 2 decimal places)
    const tolerance = 0.01;
    if (Math.abs(debitTotal - creditTotal) > tolerance) {
      throw new UnbalancedJournalError(
        debitTotal.toFixed(2),
        creditTotal.toFixed(2),
      );
    }
  }
}
