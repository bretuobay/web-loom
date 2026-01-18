/**
 * Row Component
 *
 * Flexbox-based row for grid layout with gutter spacing
 */

import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { RowContext } from './Col';
import styles from './Grid.module.css';

export type RowJustify = 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type RowAlign = 'top' | 'middle' | 'bottom' | 'stretch';

export interface RowProps {
  /**
   * Gutter spacing between columns (in pixels)
   * Can be a number or [horizontal, vertical] array
   * @default 0
   */
  gutter?: number | [number, number];

  /**
   * Horizontal alignment of columns
   * @default 'start'
   */
  justify?: RowJustify;

  /**
   * Vertical alignment of columns
   * @default 'top'
   */
  align?: RowAlign;

  /**
   * Allow columns to wrap
   * @default true
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
   * Children columns
   */
  children?: ReactNode;
}

/**
 * Parse gutter value to [horizontal, vertical]
 */
function parseGutter(gutter: number | [number, number] | undefined): [number, number] {
  if (gutter === undefined) {
    return [0, 0];
  }
  if (typeof gutter === 'number') {
    return [gutter, gutter];
  }
  return gutter;
}

/**
 * Row Component
 *
 * Creates a flexbox row container for grid columns
 *
 * @example
 * ```tsx
 * <Row gutter={16}>
 *   <Col span={12}>Column 1</Col>
 *   <Col span={12}>Column 2</Col>
 * </Row>
 * ```
 */
export function Row({ gutter, justify = 'start', align = 'top', wrap = true, className, style, children }: RowProps) {
  const [gutterH, gutterV] = parseGutter(gutter);

  const rowClasses = cn(
    styles.row,
    styles[`justify-${justify}`],
    styles[`align-${align}`],
    {
      [styles.wrap]: wrap,
    },
    className,
  );

  const rowStyle: CSSProperties = {
    marginLeft: gutterH > 0 ? `-${gutterH / 2}px` : undefined,
    marginRight: gutterH > 0 ? `-${gutterH / 2}px` : undefined,
    rowGap: gutterV > 0 ? `${gutterV}px` : undefined,
    ...style,
  };

  return (
    <RowContext.Provider value={{ gutterH, gutterV }}>
      <div className={rowClasses} style={rowStyle} data-gutter-h={gutterH} data-gutter-v={gutterV}>
        {children}
      </div>
    </RowContext.Provider>
  );
}
