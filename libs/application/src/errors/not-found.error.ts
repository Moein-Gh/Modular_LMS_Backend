import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(entity: string, by: string, value: string | number) {
    super({
      code: 'NOT_FOUND',
      status: 404,
      title: `${entity} یافت نشد`,
      detail: `${entity} با ${by} "${String(value)}" یافت نشد`,
      type: 'https://httpstatuses.com/404',
    });
  }
}
