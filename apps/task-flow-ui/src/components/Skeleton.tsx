import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number;
  /** Height of the skeleton (CSS value) */
  height?: string | number;
  /** Visual variant */
  variant?: 'text' | 'title' | 'avatar' | 'button' | 'card';
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/**
 * Base skeleton loading placeholder
 */
export function Skeleton({ width, height, variant = 'text', className = '', style }: SkeletonProps) {
  const variantClass = styles[variant] || '';

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`.trim()}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Task card skeleton for loading states
 */
export function TaskCardSkeleton() {
  return (
    <div className={styles.taskCard} aria-hidden="true">
      <div className={styles.taskCardHeader}>
        <div className={`${styles.skeleton} ${styles.taskCardTitle}`} />
        <div className={`${styles.skeleton} ${styles.taskCardBadge}`} />
      </div>
      <div className={styles.taskCardDescription}>
        <div className={`${styles.skeleton} ${styles.taskCardLine}`} />
        <div className={`${styles.skeleton} ${styles.taskCardLine}`} />
      </div>
      <div className={styles.taskCardFooter}>
        <div className={`${styles.skeleton} ${styles.taskCardDate}`} />
        <div className={`${styles.skeleton} ${styles.taskCardAvatar}`} />
      </div>
    </div>
  );
}

/**
 * Project card skeleton for loading states
 */
export function ProjectCardSkeleton() {
  return (
    <div className={styles.projectCard} aria-hidden="true">
      <div className={styles.projectCardHeader}>
        <div className={`${styles.skeleton} ${styles.projectCardIcon}`} />
        <div className={styles.projectCardTitleGroup}>
          <div className={`${styles.skeleton} ${styles.projectCardTitle}`} />
          <div className={`${styles.skeleton} ${styles.projectCardSubtitle}`} />
        </div>
      </div>
      <div className={styles.projectCardDescription}>
        <div className={`${styles.skeleton} ${styles.taskCardLine}`} />
        <div className={`${styles.skeleton} ${styles.taskCardLine}`} />
      </div>
      <div className={styles.projectCardMeta}>
        <div className={`${styles.skeleton} ${styles.projectCardMetaItem}`} />
        <div className={`${styles.skeleton} ${styles.projectCardMetaItem}`} />
      </div>
    </div>
  );
}

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns per row */
  columns?: number;
  /** Column widths as percentages or fixed values */
  columnWidths?: (string | number)[];
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5, columns = 4, columnWidths }: TableSkeletonProps) {
  const defaultWidths = ['20%', '30%', '25%', '15%'];
  const widths = columnWidths || defaultWidths.slice(0, columns);

  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`${styles.skeleton} ${styles.tableCell}`}
              style={{
                width: widths[colIndex] || `${100 / columns}%`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonListProps {
  /** Number of items to display */
  count?: number;
  /** Type of skeleton to render */
  type: 'task' | 'project';
}

/**
 * List of skeleton items for loading states
 */
export function SkeletonList({ count = 3, type }: SkeletonListProps) {
  const SkeletonComponent = type === 'task' ? TaskCardSkeleton : ProjectCardSkeleton;

  return (
    <div className="stagger-container" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="stagger-item">
          <SkeletonComponent />
        </div>
      ))}
    </div>
  );
}
