import { AppError } from '@app/application/errors/app-error';

export class UnbalancedJournalError extends AppError {
  constructor(debitTotal: string, creditTotal: string) {
    super({
      code: 'UNBALANCED_JOURNAL',
      status: 422,
      title: 'Journal entries are unbalanced',
      detail: `Journal entries must have equal debits and credits. Debits: ${debitTotal}, Credits: ${creditTotal}`,
    });
  }
}
