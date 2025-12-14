import type { PaginationConfig, UsePaginationOptions } from './types';

export interface PaginationResult<T> {
  paginatedData: T[];
  hasPagination: boolean;
  total: number;
  current: number;
  pageSize: number;
  pageCount: number;
  pageSizeOptions: number[];
}

const DEFAULT_PAGINATION: PaginationConfig = {
  pageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
};

export function usePagination<T>({
  data,
  pagination = DEFAULT_PAGINATION,
  state,
}: UsePaginationOptions<T>): PaginationResult<T> {
  if (pagination === false) {
    return {
      paginatedData: data,
      hasPagination: false,
      total: data.length,
      current: 1,
      pageSize: data.length || 1,
      pageCount: 1,
      pageSizeOptions: [],
    };
  }

  const pageSize = state?.pageSize ?? pagination.pageSize ?? DEFAULT_PAGINATION.pageSize!;
  const total = pagination.total ?? data.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rawCurrent = state?.current ?? pagination.current ?? 1;
  const current = Math.min(Math.max(1, rawCurrent), pageCount);

  const start = (current - 1) * pageSize;
  const paginatedData = data.slice(start, Math.min(total, start + pageSize));
  const pageSizeOptions = pagination.pageSizeOptions ?? DEFAULT_PAGINATION.pageSizeOptions!;

  return {
    paginatedData,
    hasPagination: !!pagination,
    total,
    current,
    pageSize,
    pageCount,
    pageSizeOptions,
  };
}
