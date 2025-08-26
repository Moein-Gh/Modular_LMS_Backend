import { AppError } from '../../errors/app-error';

export class InvalidOrExpiredCodeError extends AppError {
  constructor() {
    super({
      code: 'INVALID_OR_EXPIRED_CODE',
      status: 400,
      title: 'Invalid or expired code',
      detail: 'The provided SMS code is invalid or has expired.',
    });
  }
}
