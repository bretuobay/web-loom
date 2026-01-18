import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import '../../styles/design-system.css';
import './Divider.css';

export interface DividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'type'> {
  /** Type of divider (default: 'horizontal') */
  type?: 'horizontal' | 'vertical';
  /** Text orientation in divider (only for horizontal type with children) */
  orientation?: 'left' | 'right' | 'center';
  /** Whether to use dashed line style */
  dashed?: boolean;
  /** Whether to use plain text style (less emphasis) */
  plain?: boolean;
  /** Text or content to display in divider */
  children?: ReactNode;
}

/**
 * Divider component for visual separation of content.
 * Supports horizontal and vertical orientations, text placement, and dashed styles.
 */
export function Divider({
  className,
  type = 'horizontal',
  orientation = 'center',
  dashed = false,
  plain = false,
  children,
  ...rest
}: DividerProps) {
  const hasChildren = children !== undefined && children !== null;

  const dividerClasses = cn(
    'loom-divider',
    `loom-divider-${type}`,
    {
      [`loom-divider-with-text-${orientation}`]: hasChildren && type === 'horizontal',
      'loom-divider-with-text': hasChildren && type === 'horizontal',
      'loom-divider-dashed': dashed,
      'loom-divider-plain': plain,
    },
    className,
  );

  // Vertical divider doesn't support text
  if (type === 'vertical') {
    return <div className={dividerClasses} role="separator" aria-orientation="vertical" {...rest} />;
  }

  // Horizontal divider without text
  if (!hasChildren) {
    return <div className={dividerClasses} role="separator" aria-orientation="horizontal" {...rest} />;
  }

  // Horizontal divider with text
  return (
    <div className={dividerClasses} role="separator" aria-orientation="horizontal" {...rest}>
      <span className="loom-divider-inner-text">{children}</span>
    </div>
  );
}
