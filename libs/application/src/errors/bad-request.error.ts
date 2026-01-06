import { AppError } from './app-error';

export class BadRequestError extends AppError {
  constructor(detail?: string) {
    super({
      code: 'BAD_REQUEST',
      status: 400,
      title: 'درخواست نامعتبر',
      detail: detail ?? 'درخواست نامعتبر است',
      type: 'https://httpstatuses.com/400',
    });
  }
}
