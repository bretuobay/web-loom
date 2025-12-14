import { usePagination } from './usePagination';
import { useSorting } from './useSorting';
import type { ColumnType, SortingState, SortDirection, UseTableOptions } from './types';

export interface TablePaginationSummary {
  current: number;
  pageSize: number;
  pageCount: number;
  total: number;
  pageSizeOptions: number[];
  hasPagination: boolean;
}

export interface TableSortingSummary<T> {
  activeColumnKey?: string;
  activeOrder?: SortDirection;
  getNextSortState: (column: ColumnType<T>) => SortingState;
}

export interface TableResult<T> {
  rows: T[];
  sortedData: T[];
  total: number;
  pagination?: TablePaginationSummary;
  sorting: TableSortingSummary<T>;
}

export function useTable<T>({
  data,
  columns,
  pagination,
  sortState,
  paginationState,
  sortDirections,
}: UseTableOptions<T>): TableResult<T> {
  const sorting = useSorting<T>({
    columns,
    data,
    state: sortState,
    sortDirections,
  });

  const paginationResult = usePagination<T>({
    data: sorting.sortedData,
    pagination: pagination ?? { pageSize: 10 },
    state: paginationState,
  });

  return {
    rows: paginationResult.paginatedData,
    sortedData: sorting.sortedData,
    total: paginationResult.total,
    pagination: paginationResult.hasPagination
      ? {
          current: paginationResult.current,
          pageSize: paginationResult.pageSize,
          pageCount: paginationResult.pageCount,
          total: paginationResult.total,
          pageSizeOptions: paginationResult.pageSizeOptions,
          hasPagination: paginationResult.hasPagination,
        }
      : undefined,
    sorting: {
      activeColumnKey: sorting.activeColumnKey,
      activeOrder: sorting.activeOrder,
      getNextSortState: sorting.getNextSortState,
    },
  };
}
