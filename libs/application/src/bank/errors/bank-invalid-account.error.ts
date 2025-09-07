import { AppError } from '../../errors/app-error';

export class BankInvalidAccountError extends AppError {
  constructor(detail?: string) {
    super({
      code: 'BANK_INVALID_ACCOUNT',
      status: 400,
      title: 'Invalid account for bank',
      detail:
        detail ?? 'Provided account is invalid for use as a bank account.',
      type: 'https://httpstatuses.com/400',
    });
  }
}
