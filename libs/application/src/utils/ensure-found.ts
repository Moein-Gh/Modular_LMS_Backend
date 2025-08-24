import { NotFoundError } from '../errors/not-found.error';

export function ensureFound<T>(
  value: T | null | undefined,
  params: { entity: string; by: string; value: string | number },
): T {
  if (value == null)
    throw new NotFoundError(params.entity, params.by, params.value);
  return value;
}
