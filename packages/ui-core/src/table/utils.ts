import type { ColumnType, SortDirection, SortingState } from './types';

export const DEFAULT_COLUMN_WIDTH = 160;

export function getColumnKey<T>(column: ColumnType<T>, fallback?: number): string {
  if (column.key) return column.key;
  if (typeof column.dataIndex === 'string') return column.dataIndex;
  if (typeof column.dataIndex === 'number') return column.dataIndex.toString();
  if (fallback !== undefined) return `column-${fallback}`;
  return `column-${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveColumnValue<T>(record: T, column: ColumnType<T>) {
  if (column.dataIndex === undefined || column.dataIndex === null) {
    return undefined;
  }
  return (record as Record<string, unknown>)[String(column.dataIndex)];
}

export function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0;

  if (left === null || left === undefined) return -1;
  if (right === null || right === undefined) return 1;

  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function defaultComparator<T>(column: ColumnType<T>) {
  return (a: T, b: T) => compareValues(resolveColumnValue(a, column), resolveColumnValue(b, column));
}

export function getSortCycle(directions?: SortDirection[]): (SortDirection | undefined)[] {
  const enabledDirections = directions?.length ? directions : (['ascend', 'descend'] as SortDirection[]);
  return [...enabledDirections, undefined];
}

export function getNextSortState<T>(
  column: ColumnType<T>,
  currentState: SortingState | undefined,
  cycle: (SortDirection | undefined)[]
): SortingState {
  const key = getColumnKey(column);
  const isSameColumn = currentState?.columnKey === key;
  const currentIndex = cycle.findIndex((direction) => direction === currentState?.order);
  const nextIndex = isSameColumn ? (currentIndex + 1) % cycle.length : 0;
  const nextOrder = cycle[nextIndex];
  if (!nextOrder) {
    return {};
  }
  return {
    columnKey: key,
    order: nextOrder,
  };
}

export function applySort<T>(data: T[], column: ColumnType<T> | undefined, order?: SortDirection) {
  if (!column || !order) return [...data];
  const { sorter } = column;

  const comparator =
    typeof sorter === 'function'
      ? sorter
      : sorter
      ? defaultComparator(column)
      : undefined;

  if (!comparator) {
    return [...data];
  }

  const adjustedFactor = order === 'descend' ? -1 : 1;
  return [...data].sort((a, b) => comparator(a, b) * adjustedFactor);
}
