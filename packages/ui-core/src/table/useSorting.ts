import { applySort, getColumnKey, getNextSortState, getSortCycle } from './utils';
import type { ColumnType, SortDirection, SortingState, UseSortingOptions } from './types';

export interface SortingResult<T> {
  sortedData: T[];
  activeColumnKey?: string;
  activeOrder?: SortDirection;
  getNextSortState: (column: ColumnType<T>) => SortingState;
}

export function useSorting<T>({ data, columns, state, sortDirections }: UseSortingOptions<T>): SortingResult<T> {
  const cycle = getSortCycle(sortDirections);
  const activeColumn = columns.find((column, index) => getColumnKey(column, index) === state?.columnKey);
  const sortedData = applySort(data, activeColumn, state?.order);

  return {
    sortedData,
    activeColumnKey: state?.columnKey,
    activeOrder: state?.order,
    getNextSortState(column) {
      return getNextSortState(column, state, cycle);
    },
  };
}
