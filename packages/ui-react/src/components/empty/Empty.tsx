import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Empty.module.css';

/**
 * Default empty state illustration
 */
const DEFAULT_IMAGE = (
  <svg
    width="64"
    height="41"
    viewBox="0 0 64 41"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <g>
      <rect x="0" y="0" width="64" height="41" rx="8" fill="currentColor" opacity="0.1" />
      <circle cx="20" cy="20" r="8" fill="currentColor" opacity="0.15" />
      <rect x="36" y="12" width="16" height="12" rx="4" fill="currentColor" opacity="0.15" />
      <rect x="12" y="32" width="40" height="4" rx="2" fill="currentColor" opacity="0.12" />
    </g>
  </svg>
);

/**
 * Size variants for the Empty component
 */
export type EmptySize = 'small' | 'default' | 'large';

/**
 * Props for the Empty component
 */
export interface EmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Custom description text or element
   * @default 'No Data'
   */
  description?: ReactNode;

  /**
   * Custom image or icon to display
   * @default DEFAULT_IMAGE
   */
  image?: ReactNode;

  /**
   * Custom styles for the image wrapper
   */
  imageStyle?: CSSProperties;

  /**
   * Size of the empty state
   * @default 'default'
   */
  size?: EmptySize;

  /**
   * Action buttons or other interactive elements
   */
  children?: ReactNode;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Custom inline styles
   */
  style?: CSSProperties;
}

/**
 * Empty component for displaying empty states
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Empty />
 *
 * // With custom description
 * <Empty description="No items found" />
 *
 * // With action button
 * <Empty description="No results">
 *   <Button type="primary">Create New</Button>
 * </Empty>
 *
 * // Small size
 * <Empty size="small" description="Empty" />
 * ```
 */
export const Empty = forwardRef<HTMLDivElement, EmptyProps>(
  (
    {
      description = 'No Data',
      image = DEFAULT_IMAGE,
      imageStyle,
      size = 'default',
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          styles.empty,
          {
            [styles[`size-${size}`]]: size,
          },
          className,
        )}
        style={style}
        role="status"
        aria-live="polite"
        {...rest}
      >
        <div className={styles.image} style={imageStyle}>
          {image}
        </div>
        {description && <div className={styles.description}>{description}</div>}
        {children && <div className={styles.footer}>{children}</div>}
      </div>
    );
  },
);
