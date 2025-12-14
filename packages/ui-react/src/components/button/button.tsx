/**
 * Button Component
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Fully accessible with keyboard navigation and ARIA attributes.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Button.module.css';

/**
 * Button type variants
 */
export type ButtonType = 'primary' | 'default' | 'dashed' | 'link' | 'text';

/**
 * Button size options
 */
export type ButtonSize = 'small' | 'middle' | 'large';

/**
 * Button shape options
 */
export type ButtonShape = 'default' | 'circle' | 'round';

/**
 * Button component props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button type/variant
   * @default 'default'
   */
  variant?: ButtonType;

  /**
   * Button size
   * @default 'middle'
   */
  size?: ButtonSize;

  /**
   * Button shape
   * @default 'default'
   */
  shape?: ButtonShape;

  /**
   * Show loading spinner
   * @default false
   */
  loading?: boolean;

  /**
   * Danger/destructive action styling
   * @default false
   */
  danger?: boolean;

  /**
   * Icon element (shown before text)
   */
  icon?: ReactNode;

  /**
   * Make button full width
   * @default false
   */
  block?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Button content
   */
  children?: ReactNode;
}

/**
 * Loading spinner component
 */
function LoadingSpinner({ size = 'middle' }: { size?: ButtonSize }) {
  const spinnerSize = size === 'small' ? 12 : size === 'large' ? 16 : 14;

  return (
    <span className={styles.spinner} role="status" aria-label="Loading" style={{
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
      }}>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.spinnerSvg}
      >
        <circle
          cx="8"
          cy="8"
          r="7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="32"
          strokeDashoffset="8"
        />
      </svg>
    </span>
  );
}

/**
 * Button Component
 *
 * @example
 * ```tsx
 * // Basic button
 * <Button>Click me</Button>
 *
 * // Primary variant
 * <Button variant="primary">Primary Action</Button>
 *
 * // With icon
 * <Button icon={<IconPlus />}>Add Item</Button>
 *
 * // Loading state
 * <Button loading>Processing...</Button>
 *
 * // Danger button
 * <Button danger>Delete</Button>
 *
 * // Circle icon button
 * <Button shape="circle" icon={<IconSettings />} />
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'default',
      size = 'middle',
      shape = 'default',
      loading = false,
      danger = false,
      icon,
      block = false,
      disabled,
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Build class names
    const buttonClasses = cn(
      styles.button,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      styles[`shape-${shape}`],
      {
        [styles.danger]: danger && variant !== 'link' && variant !== 'text',
        [styles.block]: block,
        [styles.loading]: loading,
        [styles.disabled]: isDisabled,
        [styles.iconOnly]: !children && (icon || loading),
      },
      className
    );

    // Handle click when loading
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        onClick={handleClick}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <span className={styles.loadingIcon}>
            <LoadingSpinner size={size} />
          </span>
        )}

        {!loading && icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}

        {children && <span className={styles.content}>{children}</span>}
      </button>
    );
  }
);
