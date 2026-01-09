import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Badge.module.css';

export interface BadgeProps {
  /**
   * Number to show in badge
   */
  count?: ReactNode;
  /**
   * Show a red dot instead of count
   */
  dot?: boolean;
  /**
   * Whether to display a zero count
   */
  showZero?: boolean;
  /**
   * Max count to show
   * @default 99
   */
  overflowCount?: number;
  /**
   * Set offset of the badge dot
   */
  offset?: [number, number];
  /**
   * Size of the badge
   * @default 'default'
   */
  size?: 'default' | 'small';
  /**
   * Set badge as a status dot
   */
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  /**
   * Text to show when using status
   */
  text?: ReactNode;
  /**
   * Title attribute for the badge
   */
  title?: string;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Content to wrap with badge
   */
  children?: ReactNode;
  /**
   * Badge color (for custom colors)
   */
  color?: string;
}

const Badge = forwardRef<HTMLElement, BadgeProps>(
  (
    {
      count,
      dot = false,
      showZero = false,
      overflowCount = 99,
      offset,
      size = 'default',
      status,
      text,
      title,
      className,
      children,
      color,
    },
    ref,
  ) => {
    // Determine if badge should be visible
    const hasCount = count !== undefined && count !== null;
    const numericCount = typeof count === 'number' ? count : 0;
    const shouldShowBadge = dot || hasCount || status;
    const shouldShowCount = hasCount && (showZero || numericCount > 0);

    // Format the count display
    const displayCount =
      typeof count === 'number' && count > overflowCount ? `${overflowCount}+` : count;

    // Calculate offset styles
    const offsetStyle: React.CSSProperties = offset
      ? {
          transform: `translate(${offset[0]}px, ${offset[1]}px)`,
        }
      : {};

    // Custom color style
    const colorStyle: React.CSSProperties = color
      ? {
          backgroundColor: color,
        }
      : {};

    // Status badge (standalone)
    if (status && !children) {
      return (
        <span
          ref={ref as React.ForwardedRef<HTMLSpanElement>}
          className={cn(styles.badgeStatus, className)}
          title={title}
        >
          <span
            className={cn(styles.statusDot, styles[`status-${status}`])}
            style={colorStyle}
          />
          {text && <span className={styles.statusText}>{text}</span>}
        </span>
      );
    }

    // Badge wrapping children
    if (children) {
      return (
        <span
          ref={ref as React.ForwardedRef<HTMLSpanElement>}
          className={cn(styles.badgeWrapper, className)}
        >
          {children}
          {shouldShowBadge && (
            <sup
              className={cn(
                styles.badge,
                {
                  [styles.badgeDot]: dot,
                  [styles.badgeSmall]: size === 'small',
                  [styles.badgeStatus]: status,
                  [styles[`status-${status}`]]: status,
                  [styles.badgeMultiple]: !dot && shouldShowCount && numericCount > 9,
                },
              )}
              style={{ ...offsetStyle, ...colorStyle }}
              title={title || (typeof count === 'number' ? String(count) : undefined)}
            >
              {!dot && shouldShowCount && (
                <span className={styles.badgeCount}>
                  {displayCount}
                </span>
              )}
              <span className="sr-only">
                {typeof count === 'number' && count > 0
                  ? `${count} notification${count > 1 ? 's' : ''}`
                  : status
                    ? `Status: ${status}`
                    : 'New notification'}
              </span>
            </sup>
          )}
        </span>
      );
    }

    // Standalone count badge
    return (
      <span
        ref={ref as React.ForwardedRef<HTMLSpanElement>}
        className={cn(
          styles.badgeStandalone,
          {
            [styles.badgeSmall]: size === 'small',
          },
          className,
        )}
        style={colorStyle}
        title={title}
      >
        {displayCount}
      </span>
    );
  },
);

export { Badge };
