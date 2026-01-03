export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export interface BaseQueryParams {
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: string;
  orderDir?: OrderDirection;
  isDeleted?: boolean;
}
