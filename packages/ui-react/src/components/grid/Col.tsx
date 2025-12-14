/**
 * Col Component
 *
 * Responsive column for grid layout
 */

import { type CSSProperties, type ReactNode, useContext, createContext } from 'react';
import { cn } from '../../utils/cn';
import styles from './Grid.module.css';

export interface ColSize {
  span?: number;
  offset?: number;
}

export interface ColProps {
  /**
   * Number of columns to span (out of 24)
   * @default undefined (auto)
   */
  span?: number;

  /**
   * Number of columns to offset
   * @default 0
   */
  offset?: number;

  /**
   * Order of the column
   * @default 0
   */
  order?: number;

  /**
   * < 576px, number or object { span, offset }
   */
  xs?: number | ColSize;

  /**
   * ≥ 576px, number or object { span, offset }
   */
  sm?: number | ColSize;

  /**
   * ≥ 768px, number or object { span, offset }
   */
  md?: number | ColSize;

  /**
   * ≥ 992px, number or object { span, offset }
   */
  lg?: number | ColSize;

  /**
   * ≥ 1200px, number or object { span, offset }
   */
  xl?: number | ColSize;

  /**
   * ≥ 1600px, number or object { span, offset }
   */
  xxl?: number | ColSize;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Custom style
   */
  style?: CSSProperties;

  /**
   * Children content
   */
  children?: ReactNode;
}

// Context to get gutter from parent Row
export const RowContext = createContext<{ gutterH: number; gutterV: number }>({
  gutterH: 0,
  gutterV: 0,
});

/**
 * Parse responsive size prop
 */
function parseSize(size: number | ColSize | undefined): ColSize {
  if (size === undefined) {
    return {};
  }
  if (typeof size === 'number') {
    return { span: size };
  }
  return size;
}

/**
 * Col Component
 *
 * Responsive column component for grid layouts
 *
 * @example
 * ```tsx
 * <Row>
 *   <Col span={12} md={8} lg={6}>Responsive Column</Col>
 * </Row>
 * ```
 */
export function Col({
  span,
  offset,
  order,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  className,
  style,
  children,
}: ColProps) {
  const { gutterH } = useContext(RowContext);

  // Parse responsive sizes
  const xsSize = parseSize(xs);
  const smSize = parseSize(sm);
  const mdSize = parseSize(md);
  const lgSize = parseSize(lg);
  const xlSize = parseSize(xl);
  const xxlSize = parseSize(xxl);

  const colClasses = cn(
    styles.col,
    span !== undefined && styles[`col-${span}`],
    offset !== undefined && offset > 0 && styles[`col-offset-${offset}`],
    xsSize.span && styles[`col-xs-${xsSize.span}`],
    xsSize.offset && styles[`col-xs-offset-${xsSize.offset}`],
    smSize.span && styles[`col-sm-${smSize.span}`],
    smSize.offset && styles[`col-sm-offset-${smSize.offset}`],
    mdSize.span && styles[`col-md-${mdSize.span}`],
    mdSize.offset && styles[`col-md-offset-${mdSize.offset}`],
    lgSize.span && styles[`col-lg-${lgSize.span}`],
    lgSize.offset && styles[`col-lg-offset-${lgSize.offset}`],
    xlSize.span && styles[`col-xl-${xlSize.span}`],
    xlSize.offset && styles[`col-xl-offset-${xlSize.offset}`],
    xxlSize.span && styles[`col-xxl-${xxlSize.span}`],
    xxlSize.offset && styles[`col-xxl-offset-${xxlSize.offset}`],
    className
  );

  const colStyle: CSSProperties = {
    paddingLeft: gutterH > 0 ? `${gutterH / 2}px` : undefined,
    paddingRight: gutterH > 0 ? `${gutterH / 2}px` : undefined,
    order: order !== undefined ? order : undefined,
    ...style,
  };

  return (
    <div className={colClasses} style={colStyle}>
      {children}
    </div>
  );
}
