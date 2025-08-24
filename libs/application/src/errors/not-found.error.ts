import { AppError } from './app-error';

export class NotFoundError extends AppError {
  constructor(entity: string, by: string, value: string | number) {
    super({
      code: 'NOT_FOUND',
      status: 404,
      title: `${entity} not found`,
      detail: `${entity} with ${by} "${String(value)}" was not found`,
      type: 'https://httpstatuses.com/404',
    });
  }
}
