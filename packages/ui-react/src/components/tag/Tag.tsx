/**
 * Tag Component
 *
 * A compact element for displaying labels, categories, and status information.
 * Supports theming, closable functionality, icons, and interactive variants.
 */

import { forwardRef, useState, type HTMLAttributes, type ReactNode, type MouseEvent } from 'react';
import { cn } from '../../utils/cn';
import styles from './Tag.module.css';

/**
 * Preset color variants
 */
export type TagColorType = 'success' | 'processing' | 'error' | 'warning' | 'default';

/**
 * Tag component props
 */
export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /**
   * Tag color - preset variant or custom color string
   * @default 'default'
   */
  color?: TagColorType | string;

  /**
   * Whether the tag can be closed
   * @default false
   */
  closable?: boolean;

  /**
   * Custom close icon
   */
  closeIcon?: ReactNode;

  /**
   * Whether the tag is visible
   * @default true
   */
  visible?: boolean;

  /**
   * Callback when tag is closed
   */
  onClose?: (e: MouseEvent<HTMLElement>) => void;

  /**
   * Icon to display before the tag content
   */
  icon?: ReactNode;

  /**
   * Whether to show border
   * @default true
   */
  bordered?: boolean;

  /**
   * Tag content
   */
  children?: ReactNode;
}

/**
 * CheckableTag component props
 */
export interface CheckableTagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  /**
   * Whether the tag is checked
   */
  checked?: boolean;

  /**
   * Callback when check state changes
   */
  onChange?: (checked: boolean) => void;

  /**
   * Tag content
   */
  children?: ReactNode;
}

/**
 * Default close icon component
 */
const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M6.00008 4.58599L10.3001 0.285988L11.7141 1.69999L7.41408 5.99999L11.7141 10.3L10.3001 11.714L6.00008 7.41399L1.70008 11.714L0.286082 10.3L4.58608 5.99999L0.286082 1.69999L1.70008 0.285988L6.00008 4.58599Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Tag component for labels and categories
 */
const TagComponent = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      color = 'default',
      closable = false,
      closeIcon,
      visible = true,
      onClose,
      icon,
      bordered = true,
      children,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(visible);

    // Handle close
    const handleClose = (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setIsVisible(false);
      onClose?.(e);
    };

    // Don't render if not visible
    if (!isVisible) {
      return null;
    }

    // Check if color is a preset or custom
    const isPresetColor = ['success', 'processing', 'error', 'warning', 'default'].includes(
      color as TagColorType
    );

    // Build CSS classes
    const tagClasses = cn(
      styles.tag,
      {
        [styles.bordered]: bordered,
        [styles.closable]: closable,
        [styles[color as TagColorType]]: isPresetColor,
        [styles.customColor]: !isPresetColor,
      },
      className
    );

    // Custom color styles
    const customStyles = !isPresetColor
      ? {
          '--tag-color': color,
          '--tag-bg': `${color}15`, // 15% opacity
          '--tag-border': `${color}40`, // 40% opacity
          ...style,
        }
      : style;

    return (
      <span ref={ref} className={tagClasses} style={customStyles} {...rest}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.content}>{children}</span>
        {closable && (
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close tag"
          >
            {closeIcon || <CloseIcon />}
          </button>
        )}
      </span>
    );
  }
);

/**
 * CheckableTag component for selectable tags
 */
export const CheckableTag = forwardRef<HTMLSpanElement, CheckableTagProps>(
  ({ checked = false, onChange, children, className, ...rest }, ref) => {
    const handleClick = () => {
      onChange?.(!checked);
    };

    const tagClasses = cn(
      styles.tag,
      styles.checkable,
      {
        [styles.checked]: checked,
      },
      className
    );

    return (
      <span
        ref={ref}
        className={tagClasses}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        {...rest}
      >
        <span className={styles.content}>{children}</span>
      </span>
    );
  }
);

// Create compound component with proper typing
export interface TagType extends React.ForwardRefExoticComponent<TagProps & React.RefAttributes<HTMLSpanElement>> {
  CheckableTag: typeof CheckableTag;
}

const Tag = TagComponent as TagType;
Tag.CheckableTag = CheckableTag;

export { Tag };
