import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import styles from './List.module.css';

const DEFAULT_PAGE_SIZE = 5;
const DEFAULT_SKELETON_ROWS = 3;

export interface PaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  pageSizeOptions?: number[];
  onChange?: (page: number, pageSize: number) => void;
  simple?: boolean;
}

export interface GridConfig {
  column?: number;
  gutter?: number;
  minItemWidth?: number;
}

export interface ListItemMetaProps {
  avatar?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}

export interface ListProps<T = unknown> extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  dataSource?: T[];
  renderItem?: (item: T, index: number) => ReactNode;
  size?: 'small' | 'default' | 'large';
  split?: boolean;
  bordered?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  pagination?: false | PaginationConfig;
  grid?: GridConfig;
  rowKey?: keyof T | ((item: T, index: number) => string);
  children?: ReactNode;
}

export interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  actions?: ReactNode[];
  extra?: ReactNode;
  children?: ReactNode;
}

const getItemKey = <T,>(item: T, index: number, rowKey?: keyof T | ((item: T, index: number) => string)) => {
  if (typeof rowKey === 'function') return rowKey(item, index);
  if (typeof rowKey === 'string') {
    const value = (item as Record<string, unknown>)[rowKey];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }

  const fallbackValue = (item as Record<string, unknown>).key ?? (item as Record<string, unknown>).id;
  if (fallbackValue !== undefined && fallbackValue !== null) {
    return String(fallbackValue);
  }

  return `list-item-${index}`;
};

const DefaultItemRenderer = (item: unknown) => {
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    return <span className={styles.defaultText}>{String(item)}</span>;
  }
  return <pre className={styles.defaultPre}>{JSON.stringify(item, null, 2)}</pre>;
};

const LoadingSpinner = () => (
  <span className={styles.spinner} role="status" aria-label="Loading">
    <span className={styles.spinnerArc} />
  </span>
);

const Pagination = ({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [5, 10, 20],
}: {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, size: number) => void;
  pageSizeOptions?: number[];
}) => {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const windowSize = 5;
  const startPage = Math.max(1, Math.min(current - 2, Math.max(1, pageCount - windowSize + 1)));
  const endPage = Math.min(pageCount, startPage + windowSize - 1);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);

  return (
    <div className={styles.pagination} aria-label="List pagination">
      <button
        type="button"
        className={cn(styles.pageButton, { [styles.disabledPage]: current === 1 })}
        onClick={() => onChange(Math.max(1, current - 1), pageSize)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        Previous
      </button>
      <div className={styles.pageNumbers}>
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            className={cn(styles.pageButton, { [styles.activePage]: page === current })}
            onClick={() => onChange(page, pageSize)}
            aria-current={page === current ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={cn(styles.pageButton, { [styles.disabledPage]: current === pageCount })}
        onClick={() => onChange(Math.min(pageCount, current + 1), pageSize)}
        disabled={current === pageCount}
        aria-label="Next page"
      >
        Next
      </button>
      <label className={styles.pageSizeLabel}>
        <span>Per page</span>
        <select
          value={pageSize}
          onChange={(event) => onChange(1, Number(event.target.value))}
          aria-label="Items per page"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

const buildGridStyles = (grid?: GridConfig): CSSProperties => {
  if (!grid) return {};
  if (grid.minItemWidth) {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${grid.minItemWidth}px, 1fr))`,
      gap: `${grid.gutter ?? 16}px`,
    };
  }
  const columns = Math.max(1, grid.column ?? 1);
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: `${grid.gutter ?? 16}px`,
  };
};

const ListItemInner = forwardRef<HTMLLIElement, ListItemProps>(
  ({ actions = [], extra, children, className, onClick, onKeyDown, ...rest }, ref) => {
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLLIElement>) => {
        onKeyDown?.(event);
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick((event as unknown) as MouseEvent<HTMLLIElement>);
        }
      },
      [onClick, onKeyDown],
    );

    return (
      <li
        ref={ref}
        className={cn(styles.item, className)}
        role="listitem"
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        <div className={styles.itemMain}>
          <div className={styles.itemBody}>{children}</div>
          {extra && <div className={styles.itemExtra}>{extra}</div>}
        </div>
        {actions.length > 0 && (
          <div className={styles.itemActions} role="group" aria-label="Item actions">
            {actions.map((action, index) => (
              <span key={index} className={styles.actionWrapper}>
                {action}
              </span>
            ))}
          </div>
        )}
      </li>
    );
  },
);

ListItemInner.displayName = 'List.Item';

const Meta = ({ avatar, title, description }: ListItemMetaProps) => (
  <div className={styles.meta}>
    {avatar && <div className={styles.metaAvatar}>{avatar}</div>}
    <div>
      {title && <div className={styles.metaTitle}>{title}</div>}
      {description && <div className={styles.metaDescription}>{description}</div>}
    </div>
  </div>
);

const ListInner = <T,>(
  {
    dataSource = [],
    renderItem,
    size = 'default',
    split = true,
    bordered = false,
    header,
    footer,
    loading = false,
    pagination = false,
    grid,
    rowKey,
    children,
    className,
    style,
    ...rest
  }: ListProps<T>,
  ref: React.ForwardedRef<HTMLUListElement>,
) => {
  const listData = useMemo(() => dataSource ?? [], [dataSource]);
  const paginationConfig = pagination !== false ? pagination : undefined;
  const [currentPage, setCurrentPage] = useState(paginationConfig?.current ?? 1);
  const [pageSize, setPageSize] = useState(paginationConfig?.pageSize ?? DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (paginationConfig?.current && paginationConfig.current !== currentPage) {
      setCurrentPage(paginationConfig.current);
    }
  }, [paginationConfig?.current, currentPage]);

  useEffect(() => {
    if (paginationConfig?.pageSize && paginationConfig.pageSize !== pageSize) {
      setPageSize(paginationConfig.pageSize);
    }
  }, [paginationConfig?.pageSize, pageSize]);

  const safePageSize = Math.max(1, pageSize);
  const totalItems = paginationConfig?.total ?? listData.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / safePageSize));

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const normalizedPage = Math.min(Math.max(1, currentPage), pageCount);

  const displayData = useMemo(() => {
    if (!pagination) return listData;
    const start = (normalizedPage - 1) * safePageSize;
    return listData.slice(start, start + safePageSize);
  }, [listData, pagination, normalizedPage, safePageSize]);

  const showData = displayData.length > 0;

  const handlePageChange = useCallback(
    (page: number, size: number) => {
      setCurrentPage(page);
      setPageSize(size);
      paginationConfig?.onChange?.(page, size);
    },
    [paginationConfig],
  );

  const skeletonCount = Math.max(DEFAULT_SKELETON_ROWS, grid?.column ?? 1, Math.min(safePageSize, 8));

  const skeletonNodes = useMemo(
    () =>
      Array.from({ length: skeletonCount }, (_, idx) => (
        <li key={`skeleton-${idx}`} className={cn(styles.item, styles.skeletonItem)} aria-hidden="true">
          <div className={styles.skeletonHeader}>
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonSubline} />
          </div>
          <div className={styles.skeletonFooter}>
            <span className={styles.skeletonLine} />
          </div>
        </li>
      )),
    [skeletonCount],
  );

  const renderedItems = useMemo(() => {
    if (!showData) return null;
    return displayData.map((item, index) => {
      const key = getItemKey(item, index + (normalizedPage - 1) * safePageSize, rowKey);
      const content = renderItem ? renderItem(item, index) : DefaultItemRenderer(item);

      if (isValidElement(content)) {
        const elementType = (content.type as { displayName?: string })?.displayName;
        if (elementType === 'List.Item') {
          return cloneElement(content, { key });
        }
      }

      return (
        <ListItemInner key={key}>
          {content}
        </ListItemInner>
      );
    });
  }, [displayData, normalizedPage, renderItem, rowKey, safePageSize, showData]);

  const appliedGridStyle = useMemo(() => buildGridStyles(grid), [grid]);

  const shouldShowPagination = Boolean(pagination && totalItems > safePageSize);

  return (
    <div className={cn(styles.listWrapper, className)}>
      {header && <div className={styles.listHeader}>{header}</div>}
      <ul
        ref={ref}
        className={cn(
          styles.list,
          styles[`size-${size}`],
          {
            [styles.split]: split,
            [styles.bordered]: bordered,
            [styles.loading]: loading,
            [styles.gridLayout]: Boolean(grid),
          },
        )}
        role="list"
        aria-busy={loading}
        style={{ ...appliedGridStyle, ...style }}
        {...rest}
      >
        {renderedItems}
        {loading && skeletonNodes}
        {!showData && !renderedItems && !children && !loading && (
          <li className={styles.empty} role="listitem">
            <span>No data available</span>
          </li>
        )}
        {!showData && children}
      </ul>
      {loading && (
        <div className={styles.loadingBanner}>
          <LoadingSpinner />
          <span>Loading more items...</span>
        </div>
      )}
      {shouldShowPagination && (
        <Pagination
          current={normalizedPage}
          pageSize={safePageSize}
          total={totalItems}
          onChange={handlePageChange}
          pageSizeOptions={paginationConfig?.pageSizeOptions ?? [5, 10, 20]}
        />
      )}
      {footer && <div className={styles.listFooter}>{footer}</div>}
    </div>
  );
};

interface ListComponent {
  <T = unknown>(props: ListProps<T> & { ref?: React.ForwardedRef<HTMLUListElement> }): ReactElement | null;
  displayName?: string;
  Item: typeof ListItemInner & {
    Meta: typeof Meta;
  };
}

const ListComponent = forwardRef<HTMLUListElement, ListProps<unknown>>(ListInner) as unknown as ListComponent;

ListComponent.displayName = 'List';
ListComponent.Item = ListItemInner as typeof ListItemInner & { Meta: typeof Meta };
ListComponent.Item.Meta = Meta;

export const List = ListComponent;

export { ListItemInner as ListItem, Meta as ListItemMeta };
