import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PageMetaDto {
  @ApiProperty()
  totalItems!: number;
  @ApiProperty()
  itemCount!: number;
  @ApiProperty()
  page!: number; // 1-based
  @ApiProperty()
  pageSize!: number;
  @ApiProperty()
  totalPages!: number;
  @ApiProperty()
  hasNextPage!: boolean;
  @ApiProperty()
  hasPrevPage!: boolean;
}

export class PageLinksDto {
  @ApiProperty()
  self!: string;
  @ApiProperty()
  first!: string;
  @ApiProperty()
  last!: string;
  @ApiPropertyOptional()
  prev?: string;
  @ApiPropertyOptional()
  next?: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data!: T[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;

  @ApiPropertyOptional({ type: PageLinksDto })
  links?: PageLinksDto;

  static from<T>(params: {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
    makeUrl?: (page: number, pageSize: number) => string;
  }): PaginatedResponseDto<T> {
    const { items, totalItems, page, pageSize, makeUrl } = params;
    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / Math.max(1, pageSize)),
    );
    const itemCount = items.length;
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;

    const resp = new PaginatedResponseDto<T>();
    resp.data = items;
    resp.meta = {
      totalItems,
      itemCount,
      page,
      pageSize,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };

    if (makeUrl) {
      resp.links = {
        self: makeUrl(page, pageSize),
        first: makeUrl(1, pageSize),
        last: makeUrl(totalPages, pageSize),
        prev: hasPrevPage ? makeUrl(page - 1, pageSize) : undefined,
        next: hasNextPage ? makeUrl(page + 1, pageSize) : undefined,
      };
    }

    return resp;
  }
}
