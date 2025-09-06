import { AppError } from '../../errors/app-error';

export class AccountTypeNameTakenError extends AppError {
  constructor(name: string) {
    super({
      code: 'ACCOUNT_TYPE_NAME_TAKEN',
      status: 409,
      title: 'Account type name already exists',
      detail: `Account type with name "${name}" already exists.`,
    });
  }
}
