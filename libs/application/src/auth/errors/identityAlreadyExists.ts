import { AppError } from '../../errors/app-error';

export class IdentityAlreadyExistsError extends AppError {
  constructor() {
    super({
      code: 'IDENTITY_ALREADY_EXISTS',
      status: 409,
      title: 'Identity already exists',
      detail: 'The provided identity information already exists.',
    });
  }
}
