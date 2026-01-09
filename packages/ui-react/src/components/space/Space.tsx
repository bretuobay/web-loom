/**
 * Space Component
 *
 * Provides consistent spacing between child elements using flexbox
 */

import { type CSSProperties, type ReactNode, Children, Fragment } from 'react';
import { cn } from '../../utils/cn';
import styles from './Space.module.css';

export type SpaceSize = 'small' | 'middle' | 'large' | number;
export type SpaceDirection = 'vertical' | 'horizontal';
export type SpaceAlign = 'start' | 'end' | 'center' | 'baseline' | 'stretch';

export interface SpaceProps {
  /**
   * Direction of spacing
   * @default 'horizontal'
   */
  direction?: SpaceDirection;

  /**
   * Size of spacing between items
   * @default 'middle'
   */
  size?: SpaceSize;

  /**
   * Alignment of items
   * @default 'start'
   */
  align?: SpaceAlign;

  /**
   * Allow items to wrap
   * @default false
   */
  wrap?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Custom style
   */
  style?: CSSProperties;

  /**
   * Children elements
   */
  children?: ReactNode;
}

// Size mapping in pixels
const sizeMap = {
  small: 8,
  middle: 16,
  large: 24,
} as const;

/**
 * Get spacing value from size prop
 */
function getSize(size: SpaceSize): number {
  if (typeof size === 'number') {
    return size;
  }
  return sizeMap[size as keyof typeof sizeMap] || sizeMap.middle;
}

/**
 * Space Component
 *
 * @example
 * ```tsx
 * // Horizontal spacing
 * <Space>
 *   <Button>Button 1</Button>
 *   <Button>Button 2</Button>
 * </Space>
 *
 * // Vertical spacing
 * <Space direction="vertical">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Space>
 *
 * // Custom size
 * <Space size={32}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Space>
 * ```
 */
export function Space({
  direction = 'horizontal',
  size = 'middle',
  align = 'start',
  wrap = false,
  className,
  style,
  children,
}: SpaceProps) {
  // Filter out null/undefined children
  const items = Children.toArray(children).filter((child) => child != null);

  // Return null if no items
  if (items.length === 0) {
    return null;
  }

  // Calculate gap value
  const gap = getSize(size);

  // Build class names
  const spaceClasses = cn(
    styles.space,
    styles[`direction-${direction}`],
    styles[`align-${align}`],
    {
      [styles.wrap]: wrap,
    },
    className
  );

  // Build inline styles
  const spaceStyle: CSSProperties = {
    gap: `${gap}px`,
    ...style,
  };

  return (
    <div className={spaceClasses} style={spaceStyle}>
      {items.map((child, index) => (
        <Fragment key={index}>{child}</Fragment>
      ))}
    </div>
  );
}
