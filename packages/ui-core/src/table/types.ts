import type { ReactNode } from 'react';

/**
 * Table sort direction helpers
 */
export type SortDirection = 'ascend' | 'descend';

/**
 * Column filter definition
 */
export interface ColumnFilter {
  text: string;
  value: string;
}

/**
 * Sorter function signature
 */
export type SorterFunction<T> = (a: T, b: T) => number;

/**
 * Column definition shared by all table adapters
 */
export interface ColumnType<T> {
  title?: ReactNode;
  dataIndex?: keyof T;
  key?: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: boolean | SorterFunction<T>;
  filters?: ColumnFilter[];
  width?: number | string;
  fixed?: 'left' | 'right';
}

/**
 * Pagination configuration exposed to consumers
 */
export interface PaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  hideOnSinglePage?: boolean;
}

/**
 * Row selection configuration
 */
export interface RowSelectionType<T> {
  mode?: 'single' | 'multiple';
  selectedRowKeys?: string[];
  defaultSelectedRowKeys?: string[];
  onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

/**
 * Expandable row configuration
 */
export interface ExpandableConfig<T> {
  expandedRowRender: (record: T) => ReactNode;
  rowExpandable?: (record: T) => boolean;
  defaultExpandedRowKeys?: string[];
  expandIcon?: (props: { expanded: boolean; onExpand: () => void; record: T }) => ReactNode;
}

/**
 * Sorting state that can be shared with adapters
 */
export interface SortingState {
  columnKey?: string;
  order?: SortDirection;
}

/**
 * Pagination state controlled by UI adapters
 */
export interface PaginationState {
  current?: number;
  pageSize?: number;
}

/**
 * Filters state shared between table helpers and adapters
 */
export interface ActiveFilters {
  [columnKey: string]: string[];
}

/**
 * Input for sorting helper
 */
export interface UseSortingOptions<T> {
  data: T[];
  columns: ColumnType<T>[];
  state?: SortingState;
  sortDirections?: SortDirection[];
}

/**
 * Input for pagination helper
 */
export interface UsePaginationOptions<T> {
  data: T[];
  pagination?: false | PaginationConfig;
  state?: PaginationState;
}

/**
 * Input for full table helper
 */
export interface UseTableOptions<T> {
  data: T[];
  columns: ColumnType<T>[];
  pagination?: false | PaginationConfig;
  sortState?: SortingState;
  paginationState?: PaginationState;
  sortDirections?: SortDirection[];
}
