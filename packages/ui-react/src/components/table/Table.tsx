import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import {
  DEFAULT_COLUMN_WIDTH,
  ColumnType,
  ExpandableConfig,
  getColumnKey,
  PaginationConfig,
  resolveColumnValue,
  RowSelectionType,
  SortDirection,
  SortingState,
  useTable,
} from '@web-loom/ui-core/table';
import styles from './Table.module.css';

const DEFAULT_ROW_HEIGHT = 48;
const VIRTUAL_BUFFER_ROWS = 5;

function buildColumnWidths<T>(columns: ColumnType<T>[]) {
  const widths: Record<string, number> = {};
  columns.forEach((column, index) => {
    const key = getColumnKey(column, index);
    const widthValue =
      typeof column.width === 'number'
        ? column.width
        : typeof column.width === 'string'
          ? parseInt(column.width, 10) || DEFAULT_COLUMN_WIDTH
          : DEFAULT_COLUMN_WIDTH;
    widths[key] = widthValue;
  });
  return widths;
}

function resolveRowKeyValue<T extends Record<string, unknown>>(
  record: T,
  rowKey: TableProps<T>['rowKey'],
  fallbackIndex: number,
): string {
  if (typeof rowKey === 'function') {
    return rowKey(record);
  }

  if (typeof rowKey === 'string') {
    const value = (record as Record<string, unknown>)[rowKey];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }

  const maybeKey = (record as Record<string, unknown>).key ?? (record as Record<string, unknown>).id;
  if (maybeKey !== undefined && maybeKey !== null) {
    return String(maybeKey);
  }

  return `row-${fallbackIndex}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type TableExportFormat = 'csv' | 'json';

export interface TableProps<T extends Record<string, unknown>> {
  columns: ColumnType<T>[];
  dataSource?: T[];
  loading?: boolean;
  pagination?: false | PaginationConfig;
  scroll?: { x?: number; y?: number };
  rowSelection?: RowSelectionType<T>;
  expandable?: ExpandableConfig<T>;
  sortDirections?: SortDirection[];
  rowKey?: keyof T | ((record: T) => string);
  className?: string;
  children?: ReactNode;
}

interface ColumnWithKey<T> {
  column: ColumnType<T>;
  key: string;
}

const TableInner = <T extends Record<string, unknown>>(
  {
    columns,
    dataSource = [],
    loading = false,
    pagination,
    scroll,
    rowSelection,
    expandable,
    sortDirections = ['ascend', 'descend'],
    rowKey,
    className,
  }: TableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) => {
  const [sortState, setSortState] = useState<SortingState>({});
  const [paginationState, setPaginationState] = useState({
    current: typeof pagination === 'object' && pagination?.current ? pagination.current : 1,
    pageSize: typeof pagination === 'object' && pagination?.pageSize ? pagination.pageSize : 10,
  });
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>(expandable?.defaultExpandedRowKeys ?? []);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<string[]>(
    rowSelection?.defaultSelectedRowKeys ?? [],
  );
  const [orderedColumns, setOrderedColumns] = useState(columns);
  const [columnWidths, setColumnWidths] = useState(() => buildColumnWidths(columns));
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const resizingRef = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const prevColumnsRef = useRef(columns);
  const [draggingColumnKey, setDraggingColumnKey] = useState<string | null>(null);
  const [sortAnnouncement, setSortAnnouncement] = useState('Table sorted');

  const data = useMemo(() => dataSource ?? [], [dataSource]);

  useEffect(() => {
    if (prevColumnsRef.current !== columns) {
      setOrderedColumns(columns);
      setColumnWidths(buildColumnWidths(columns));
      prevColumnsRef.current = columns;
    }
  }, [columns]);

  useEffect(() => {
    if (!rowSelection?.selectedRowKeys) return;
    setInternalSelectedKeys(rowSelection.selectedRowKeys);
  }, [rowSelection?.selectedRowKeys]);

  const filteredData = useMemo(() => {
    const filterKeys = Object.entries(filters).filter(([, values]) => values.length > 0);
    if (!filterKeys.length) return data;
    return data.filter((record) => {
      return filterKeys.every(([columnKey, values]) => {
        const column = orderedColumns.find((columnItem, index) => getColumnKey(columnItem, index) === columnKey);
        if (!column) return true;
        const recordValue = resolveColumnValue(record, column);
        const normalized = String(recordValue ?? '').toLowerCase();
        return values.some((filterValue) => normalized.includes(filterValue.toLowerCase()));
      });
    });
  }, [data, filters, orderedColumns]);

  const tableResult = useTable<T>({
    data: filteredData,
    columns: orderedColumns,
    pagination: pagination ?? { pageSize: 10 },
    sortState,
    paginationState,
    sortDirections,
  });

  const paginationMeta = tableResult.pagination;
  const hasPagination = Boolean(paginationMeta);
  const paginatedRows = tableResult.rows;
  const totalRows = tableResult.total;
  const sortedRows = tableResult.sortedData;
  const selectionColumnWidth = rowSelection ? 48 : 0;
  const expansionColumnWidth = expandable ? 48 : 0;
  const totalColumnCount = orderedColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0);

  const enableVirtualize = Boolean(scroll?.y);
  const virtualized = useMemo(() => {
    if (!enableVirtualize) {
      return {
        rows: paginatedRows,
        topPadding: 0,
        bottomPadding: 0,
        offset: 0,
      };
    }

    const visibleCount = Math.max(1, Math.ceil((scroll?.y ?? DEFAULT_ROW_HEIGHT) / DEFAULT_ROW_HEIGHT));
    const start = clamp(Math.floor(scrollTop / DEFAULT_ROW_HEIGHT) - VIRTUAL_BUFFER_ROWS, 0, paginatedRows.length);
    const end = clamp(start + visibleCount + VIRTUAL_BUFFER_ROWS * 2, 0, paginatedRows.length);
    const sliced = paginatedRows.slice(start, end);
    const topPadding = start * DEFAULT_ROW_HEIGHT;
    const bottomPadding = Math.max(
      0,
      paginatedRows.length * DEFAULT_ROW_HEIGHT - sliced.length * DEFAULT_ROW_HEIGHT - topPadding,
    );

    return {
      rows: sliced,
      topPadding,
      bottomPadding,
      offset: start,
    };
  }, [enableVirtualize, paginatedRows, scrollTop, scroll?.y]);

  useEffect(() => {
    if (!enableVirtualize) return;
    setScrollTop((current) => clamp(current, 0, Math.max(0, paginatedRows.length * DEFAULT_ROW_HEIGHT)));
  }, [paginatedRows.length, enableVirtualize]);

  const columnsWithKeys = useMemo<ColumnWithKey<T>[]>(() => {
    return orderedColumns.map((column, index) => ({
      column,
      key: getColumnKey(column, index),
    }));
  }, [orderedColumns]);

  const leftStickyOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let current = 0;
    columnsWithKeys.forEach(({ column, key }) => {
      if (column.fixed === 'left') {
        offsets[key] = current;
        current += columnWidths[key] ?? DEFAULT_COLUMN_WIDTH;
      }
    });
    if (rowSelection) {
      offsets['selection'] = 0;
    }
    return offsets;
  }, [columnsWithKeys, columnWidths, rowSelection]);

  const rightStickyOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let current = 0;
    [...columnsWithKeys].reverse().forEach(({ column, key }) => {
      if (column.fixed === 'right') {
        offsets[key] = current;
        current += columnWidths[key] ?? DEFAULT_COLUMN_WIDTH;
      }
    });
    return offsets;
  }, [columnsWithKeys, columnWidths]);

  const getColumnStyle = useCallback(
    (columnKey: string, column: ColumnType<T>): CSSProperties => {
      const width = columnWidths[columnKey] ?? DEFAULT_COLUMN_WIDTH;
      const style: CSSProperties = {
        width,
        minWidth: width,
        maxWidth: width,
      };
      if (column.fixed === 'left' && leftStickyOffsets[columnKey] !== undefined) {
        style.position = 'sticky';
        style.left = `${leftStickyOffsets[columnKey]}px`;
        style.zIndex = 3;
      }
      if (column.fixed === 'right' && rightStickyOffsets[columnKey] !== undefined) {
        style.position = 'sticky';
        style.right = `${rightStickyOffsets[columnKey]}px`;
        style.zIndex = 3;
      }
      return style;
    },
    [columnWidths, leftStickyOffsets, rightStickyOffsets],
  );

  const isSelectionControlled = Boolean(rowSelection?.selectedRowKeys);
  const mergedSelectedKeys = isSelectionControlled ? (rowSelection?.selectedRowKeys ?? []) : internalSelectedKeys;

  const currentPageRowKeys = useMemo(() => {
    return paginatedRows.map((row, index) => resolveRowKeyValue(row, rowKey, index));
  }, [paginatedRows, rowKey]);

  useEffect(() => {
    if (!rowSelection || rowSelection.mode === 'single') return;
    if (!selectAllRef.current) return;
    const allSelected = currentPageRowKeys.every((key) => mergedSelectedKeys.includes(key));
    const someSelected = currentPageRowKeys.some((key) => mergedSelectedKeys.includes(key));
    selectAllRef.current.indeterminate = !allSelected && someSelected;
  }, [currentPageRowKeys, mergedSelectedKeys, rowSelection]);

  const handleSelectionUpdate = useCallback(
    (nextKeys: string[]) => {
      if (!isSelectionControlled) {
        setInternalSelectedKeys(nextKeys);
      }
      const selectedRecords = data.filter((record, index) =>
        nextKeys.includes(resolveRowKeyValue(record, rowKey, index)),
      );
      rowSelection?.onChange?.(nextKeys, selectedRecords);
    },
    [data, isSelectionControlled, rowKey, rowSelection],
  );

  const toggleRowSelection = useCallback(
    (record: T, fallbackIndex: number) => {
      const key = resolveRowKeyValue(record, rowKey, fallbackIndex);
      const alreadySelected = mergedSelectedKeys.includes(key);
      const mode = rowSelection?.mode ?? 'multiple';
      let nextKeys: string[];

      if (mode === 'single') {
        nextKeys = alreadySelected ? [] : [key];
      } else {
        nextKeys = alreadySelected
          ? mergedSelectedKeys.filter((selected) => selected !== key)
          : [...mergedSelectedKeys, key];
      }

      handleSelectionUpdate(nextKeys);
    },
    [handleSelectionUpdate, mergedSelectedKeys, rowKey, rowSelection],
  );

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    const nextKeys = event.target.checked ? currentPageRowKeys : [];
    handleSelectionUpdate(nextKeys);
  };

  const selectedRecordCount = mergedSelectedKeys.length;

  const applySort = (column: ColumnType<T>) => {
    setSortState(tableResult.sorting.getNextSortState(column));
  };

  const handleSortKey = (event: React.KeyboardEvent<HTMLTableCellElement>, column: ColumnType<T>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      applySort(column);
    }
  };

  const toggleFilter = (columnKey: string) => {
    setActiveFilterColumn((previous) => (previous === columnKey ? null : columnKey));
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((previous) => {
      const current = new Set(previous[columnKey] ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return { ...previous, [columnKey]: [...current] };
    });
  };

  const resetFilter = (columnKey: string) => {
    setFilters((previous) => {
      const next = { ...previous };
      delete next[columnKey];
      return next;
    });
    setActiveFilterColumn(null);
  };

  const selectedFilterCount = useMemo(() => {
    return Object.values(filters).reduce((acc, group) => acc + group.length, 0);
  }, [filters]);

  const handlePaginationChange = (nextPage: number) => {
    if (!paginationMeta) return;
    const sanitized = clamp(nextPage, 1, paginationMeta.pageCount);
    setPaginationState((previous) => ({ ...previous, current: sanitized }));
  };

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!paginationMeta) return;
    const nextSize = Number(event.target.value);
    setPaginationState({ current: 1, pageSize: nextSize });
  };

  const toggleExpandedRow = (rowKeyValue: string) => {
    setExpandedRowKeys((previous) => {
      if (previous.includes(rowKeyValue)) {
        return previous.filter((value) => value !== rowKeyValue);
      }
      return [...previous, rowKeyValue];
    });
  };

  const handleExport = (format: TableExportFormat) => {
    const columnsForExport = columnsWithKeys;
    const payload =
      format === 'csv'
        ? [
            columnsForExport.map(({ column, key }) => `"${String(column.title ?? key).replace(/"/g, '""')}"`).join(','),
            ...sortedRows.map((record) =>
              columnsForExport
                .map(({ column }) => {
                  const value = resolveColumnValue(record, column);
                  return `"${String(value ?? '').replace(/"/g, '""')}"`;
                })
                .join(','),
            ),
          ].join('\n')
        : JSON.stringify(sortedRows, null, 2);

    const mime = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `table-export-${Date.now()}.${format}`;
    if (typeof window === 'undefined') return;
    const blob = new Blob([payload], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const announcement = tableResult.sorting.activeOrder
      ? `Sorted by ${tableResult.sorting.activeColumnKey ?? 'column'} ${tableResult.sorting.activeOrder}`
      : 'Sorting cleared';
    setSortAnnouncement(announcement);
  }, [tableResult.sorting.activeColumnKey, tableResult.sorting.activeOrder]);

  const handleResizeStart = (columnKey: string, event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizingRef.current = {
      columnKey,
      startX: event.clientX,
      startWidth: columnWidths[columnKey] ?? DEFAULT_COLUMN_WIDTH,
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = event.clientX - resizingRef.current.startX;
      setColumnWidths((previous) => ({
        ...previous,
        [resizingRef.current!.columnKey]: Math.max(80, resizingRef.current!.startWidth + delta),
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDragStart = (columnKey: string) => {
    setDraggingColumnKey(columnKey);
  };

  const handleDrop = (targetKey: string) => {
    if (!draggingColumnKey || draggingColumnKey === targetKey) return;
    setOrderedColumns((previous) => {
      const draggedIndex = previous.findIndex((column, index) => getColumnKey(column, index) === draggingColumnKey);
      const targetIndex = previous.findIndex((column, index) => getColumnKey(column, index) === targetKey);
      if (draggedIndex === -1 || targetIndex === -1) return previous;
      const updated = [...previous];
      const [moved] = updated.splice(draggedIndex, 1);
      if (!moved) return previous;
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggingColumnKey(null);
  };

  const renderHeaderColumn = (column: ColumnType<T>, columnKey: string) => {
    const isSorted = tableResult.sorting.activeColumnKey === columnKey;
    const isFilterActive = Boolean(filters[columnKey]?.length);
    const ariaSort =
      isSorted && tableResult.sorting.activeOrder
        ? tableResult.sorting.activeOrder === 'ascend'
          ? 'ascending'
          : 'descending'
        : 'none';

    return (
      <th
        key={columnKey}
        role="columnheader"
        scope="col"
        tabIndex={0}
        aria-sort={ariaSort}
        className={cn(styles.stickyHeader, column.fixed && styles.stickyColumn)}
        style={getColumnStyle(columnKey, column)}
        draggable
        onDragStart={() => handleDragStart(columnKey)}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={() => handleDrop(columnKey)}
        onDragEnd={() => setDraggingColumnKey(null)}
        onClick={() => column.sorter && applySort(column)}
        onKeyDown={(event) => column.sorter && handleSortKey(event, column)}
      >
        <div className={styles.cellContent}>
          <span>{column.title}</span>
          <span>
            {column.sorter && (
              <span className={styles.sortIcon} aria-hidden="true">
                {isSorted ? (tableResult.sorting.activeOrder === 'ascend' ? '▲' : '▼') : '⇅'}
              </span>
            )}
          </span>
          {column.filters && column.filters.length > 0 && (
            <div className={styles.filterDropdown}>
              <button
                type="button"
                className={cn(styles.filterTrigger, {
                  [styles.filterTriggerActive]: isFilterActive,
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFilter(columnKey);
                }}
              >
                Filters
              </button>
              {activeFilterColumn === columnKey && (
                <div className={styles.filterMenu}>
                  {column.filters.map((filter) => (
                    <label className={styles.filterOption} key={filter.value}>
                      <input
                        type="checkbox"
                        checked={filters[columnKey]?.includes(filter.value) ?? false}
                        onChange={() => handleFilterChange(columnKey, filter.value)}
                      />
                      <span>{filter.text}</span>
                    </label>
                  ))}
                  <div className={styles.filterActions}>
                    <button type="button" onClick={() => setActiveFilterColumn(null)}>
                      Close
                    </button>
                    <button type="button" onClick={() => resetFilter(columnKey)}>
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className={styles.resizer}
          onMouseDown={(event) => handleResizeStart(columnKey, event)}
        />
      </th>
    );
  };

  const renderRowCell = (column: ColumnType<T>, record: T, rowIndex: number): ReactNode => {
    const value = resolveColumnValue(record, column);
    if (column.render) {
      return column.render(value, record, rowIndex);
    }
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div ref={ref} className={cn(styles.tableContainer, className)}>
      <div className={styles.tableActions}>
        <div className={styles.actionGroup}>
          <button type="button" className={styles.exportButton} onClick={() => handleExport('csv')}>
            Export CSV
          </button>
          <button type="button" className={styles.exportButton} onClick={() => handleExport('json')}>
            Export JSON
          </button>
        </div>
        <div className={styles.actionGroup}>
          <span>
            Selected <strong>{selectedRecordCount}</strong> rows
          </span>
          {selectedFilterCount > 0 && <span className={styles.filterBadge}>{selectedFilterCount} filters active</span>}
        </div>
      </div>
      <div
        ref={scrollViewportRef}
        className={styles.scrollViewport}
        style={scroll?.y ? { maxHeight: `${scroll.y}px` } : undefined}
        onScroll={(event) => {
          if (enableVirtualize) {
            setScrollTop(event.currentTarget.scrollTop);
          }
        }}
      >
        <div className={styles.virtualBody} style={scroll?.x ? { minWidth: `${scroll.x}px` } : undefined}>
          <table
            className={styles.tableElement}
            role="table"
            aria-rowcount={totalRows}
            aria-colcount={totalColumnCount}
          >
            <thead>
              <tr role="row">
                {rowSelection && rowSelection.mode !== 'single' && (
                  <th
                    className={cn(styles.selectionCell, styles.stickyHeader)}
                    role="columnheader"
                    scope="col"
                    style={{ width: selectionColumnWidth }}
                  >
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      aria-label="Select all rows"
                      checked={
                        currentPageRowKeys.length > 0 &&
                        currentPageRowKeys.every((key) => mergedSelectedKeys.includes(key))
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                {rowSelection && rowSelection.mode === 'single' && (
                  <th
                    className={cn(styles.selectionCell, styles.stickyHeader)}
                    role="columnheader"
                    scope="col"
                    style={{ width: selectionColumnWidth }}
                  >
                    {/* Placeholder for radio column */}
                  </th>
                )}
                {expandable && (
                  <th
                    className={cn(styles.selectionCell, styles.stickyHeader)}
                    role="columnheader"
                    scope="col"
                    style={{ width: expansionColumnWidth }}
                  >
                    {/* Expand/Collapse */}
                  </th>
                )}
                {columnsWithKeys.map(({ column, key }) => renderHeaderColumn(column, key))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {enableVirtualize && virtualized.topPadding > 0 && (
                <tr className={styles.virtualSpacer} aria-hidden="true">
                  <td colSpan={totalColumnCount} style={{ height: virtualized.topPadding }} />
                </tr>
              )}
              {virtualized.rows.length === 0 && (
                <tr role="row">
                  <td colSpan={totalColumnCount} className={styles.emptyState} role="cell">
                    No records match the current filters.
                  </td>
                </tr>
              )}
              {virtualized.rows.map((record, index) => {
                const rowIndex = virtualized.offset + index;
                const rowKeyValue = resolveRowKeyValue(record, rowKey, rowIndex);
                const rowSelected = mergedSelectedKeys.includes(rowKeyValue);
                const isExpanded = expandedRowKeys.includes(rowKeyValue);

                return (
                  <Fragment key={rowKeyValue}>
                    <tr role="row">
                      {rowSelection && (
                        <td className={styles.selectionCell} role="cell">
                          <input
                            type={rowSelection.mode === 'single' ? 'radio' : 'checkbox'}
                            checked={rowSelected}
                            onChange={() => toggleRowSelection(record, rowIndex)}
                            {...(rowSelection.getCheckboxProps?.(record) ?? {})}
                            aria-label="Select row"
                          />
                        </td>
                      )}
                      {expandable && (
                        <td className={styles.selectionCell} role="cell">
                          <button
                            type="button"
                            className={styles.expandButton}
                            onClick={() => toggleExpandedRow(rowKeyValue)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                          >
                            {expandable.expandIcon ? (
                              expandable.expandIcon({
                                expanded: isExpanded,
                                onExpand: () => toggleExpandedRow(rowKeyValue),
                                record,
                              })
                            ) : (
                              <span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
                            )}
                          </button>
                        </td>
                      )}
                      {columnsWithKeys.map(({ column, key }) => (
                        <td
                          key={key}
                          role="cell"
                          className={cn(column.fixed && styles.stickyColumn)}
                          style={getColumnStyle(key, column)}
                        >
                          {renderRowCell(column, record, rowIndex)}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && expandable && (
                      <tr role="row" className={styles.expandedRow}>
                        <td colSpan={totalColumnCount} className={styles.expandedCell}>
                          {expandable.expandedRowRender(record)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {enableVirtualize && virtualized.bottomPadding > 0 && (
                <tr className={styles.virtualSpacer} aria-hidden="true">
                  <td colSpan={totalColumnCount} style={{ height: virtualized.bottomPadding }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className={styles.loadingOverlay} aria-live="polite">
            <div className={styles.loadingIndicator}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>Loading...</span>
            </div>
          </div>
        )}
      </div>
      {hasPagination && paginationMeta && (
        <div className={styles.pagination}>
          <button type="button" disabled={paginationMeta.current <= 1} onClick={() => handlePaginationChange(1)}>
            First
          </button>
          <button
            type="button"
            disabled={paginationMeta.current <= 1}
            onClick={() => handlePaginationChange(paginationMeta.current - 1)}
          >
            Prev
          </button>
          <span>
            Page {paginationMeta.current} of {paginationMeta.pageCount}
          </span>
          <button
            type="button"
            disabled={paginationMeta.current >= paginationMeta.pageCount}
            onClick={() => handlePaginationChange(paginationMeta.current + 1)}
          >
            Next
          </button>
          <button
            type="button"
            disabled={paginationMeta.current >= paginationMeta.pageCount}
            onClick={() => handlePaginationChange(paginationMeta.pageCount)}
          >
            Last
          </button>
          <span>
            Total {paginationMeta.total} items · Page size
            <select value={paginationMeta.pageSize} onChange={handlePageSizeChange}>
              {paginationMeta.pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </span>
        </div>
      )}
      <div className={styles.srOnly} aria-live="polite">
        {sortAnnouncement}
      </div>
    </div>
  );
};

const TableComponent = forwardRef(TableInner) as <T extends Record<string, unknown>>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof TableInner>;

const Column = <T extends Record<string, unknown>>(_: ColumnType<T>) => null;

const ColumnGroup = <T extends Record<string, unknown>>(_: { title?: ReactNode; children?: ReactNode }) => null;

export const Table = Object.assign(TableComponent, {
  Column,
  ColumnGroup,
});
