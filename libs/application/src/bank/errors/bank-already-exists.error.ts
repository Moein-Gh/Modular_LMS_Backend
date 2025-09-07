import { AppError } from '../../errors/app-error';

export class BankAlreadyExistsError extends AppError {
  constructor() {
    super({
      code: 'BANK_ALREADY_EXISTS',
      status: 409,
      title: 'Bank already exists',
      detail: 'A bank is already configured; only one bank is allowed.',
      type: 'https://httpstatuses.com/409',
    });
  }
}
