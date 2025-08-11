import { AppError } from '../../errors/app-error';

export class UserAlreadyExistsError extends AppError {
  constructor(public readonly email: string) {
    super({
      code: 'USER_ALREADY_EXISTS',
      status: 409,
      title: 'User already exists',
      detail: `Email ${email} already exists`,
      type: 'https://httpstatuses.com/409',
    });
  }
}
