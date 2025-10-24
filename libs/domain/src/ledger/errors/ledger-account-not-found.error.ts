import { AppError } from '@app/application/errors/app-error';

export class LedgerAccountNotFoundError extends AppError {
  constructor(accountCode: string) {
    super({
      code: 'LEDGER_ACCOUNT_NOT_FOUND',
      status: 404,
      title: 'Ledger account not found',
      detail: `Ledger account with code '${accountCode}' was not found`,
      type: 'https://httpstatuses.com/404',
    });
  }
}
