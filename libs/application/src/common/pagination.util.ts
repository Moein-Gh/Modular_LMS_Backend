import { Prisma } from '@generated/prisma';
import { PaginationQueryDto } from './dto/pagination-query.dto';

export interface PrismaRepository<T, TFindArgs, TWhere> {
  findAll(args?: TFindArgs, tx?: Prisma.TransactionClient): Promise<T[]>;
  count(where?: TWhere, tx?: Prisma.TransactionClient): Promise<number>;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export type PaginatePrismaConfig<T, TFindArgs, TWhere> = {
  repo: PrismaRepository<T, TFindArgs, TWhere>;
  query: PaginationQueryDto;
  include?: TFindArgs extends { include?: infer I } ? I | null : never;
  searchFields?: (keyof TWhere)[];
  defaultOrderBy?: string;
  defaultOrderDir?: 'asc' | 'desc';
  where?: TWhere;
  tx?: Prisma.TransactionClient;
};

export async function paginatePrisma<
  T,
  TFindArgs extends {
    skip?: number;
    take?: number;
    where?: unknown;
    orderBy?: unknown;
  },
  TWhere extends Record<string, unknown>,
>(
  config: PaginatePrismaConfig<T, TFindArgs, TWhere>,
): Promise<{ items: T[]; totalItems: number; page: number; pageSize: number }> {
  const {
    repo,
    query,
    include,
    searchFields,
    defaultOrderBy,
    defaultOrderDir,
    where: baseWhere,
    tx,
  } = config;
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const orderBy = query?.orderBy ?? defaultOrderBy ?? 'createdAt';
  const orderDir = query?.orderDir ?? defaultOrderDir ?? 'desc';

  const where = { ...(baseWhere ?? {}) } as TWhere & {
    OR?: Array<Record<string, unknown>>;
  };
  if (query?.search && searchFields?.length) {
    where.OR = searchFields.map((field) => ({
      [String(field)]: {
        contains: String(query.search),
        mode: 'insensitive',
      },
    }));
  }

  type WhereOf<T> = T extends { where?: infer W } ? W : unknown;
  type OrderByOf<T> = T extends { orderBy?: infer O } ? O : unknown;

  const findArgs: TFindArgs = {
    ...(include ? { include } : {}),
    skip,
    take,
    where: where as unknown as WhereOf<TFindArgs>,
    orderBy: { [orderBy]: orderDir } as unknown as OrderByOf<TFindArgs>,
  } as TFindArgs;

  const items = await repo.findAll(findArgs, tx);
  const totalItems = await repo.count(where, tx);
  return { items, totalItems, page, pageSize };
}
