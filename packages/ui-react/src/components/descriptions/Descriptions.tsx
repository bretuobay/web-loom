import React, { forwardRef, ReactNode, Children, useMemo } from 'react';
import { cn } from '../../utils/cn';
import styles from './Descriptions.module.css';

/**
 * Props for the Descriptions component
 */
export interface DescriptionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * The title of the descriptions
   */
  title?: ReactNode;

  /**
   * Extra content in the top-right corner
   */
  extra?: ReactNode;

  /**
   * Whether to show borders (table layout)
   * @default false
   */
  bordered?: boolean;

  /**
   * Number of columns. Can be a number or responsive object
   * @default { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }
   */
  column?: number | Record<string, number>;

  /**
   * Size of descriptions
   * @default 'default'
   */
  size?: 'default' | 'middle' | 'small';

  /**
   * Layout direction of label and content
   * @default 'horizontal'
   */
  layout?: 'horizontal' | 'vertical';

  /**
   * Show colon after label
   * @default true
   */
  colon?: boolean;
}

/**
 * Props for the Description Item component
 */
export interface DescriptionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text
   */
  label?: ReactNode;

  /**
   * Number of columns this item spans
   * @default 1
   */
  span?: number;

  /**
   * Content of the description item
   */
  children?: ReactNode;
}

/**
 * Description Item component
 *
 * Used inside Descriptions to display individual label-content pairs
 */
const DescriptionItem = forwardRef<HTMLDivElement, DescriptionItemProps>(
  ({ label, span = 1, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(styles.item, className)} data-span={span} {...props}>
        <div className={styles.label} data-testid="descriptions-item-label">
          {label}
        </div>
        <div className={styles.content} data-testid="descriptions-item-content">
          {children}
        </div>
      </div>
    );
  },
);

/**
 * Descriptions component for displaying structured information
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Descriptions title="User Info">
 *   <Descriptions.Item label="Name">John Doe</Descriptions.Item>
 *   <Descriptions.Item label="Email">john@example.com</Descriptions.Item>
 * </Descriptions>
 *
 * // Bordered with multiple columns
 * <Descriptions title="Product Details" bordered column={3}>
 *   <Descriptions.Item label="Product">Cloud Database</Descriptions.Item>
 *   <Descriptions.Item label="Billing">Prepaid</Descriptions.Item>
 *   <Descriptions.Item label="Status">Active</Descriptions.Item>
 * </Descriptions>
 *
 * // Responsive columns
 * <Descriptions
 *   column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
 *   bordered
 * >
 *   <Descriptions.Item label="Field 1">Value 1</Descriptions.Item>
 *   <Descriptions.Item label="Field 2" span={2}>Spanning value</Descriptions.Item>
 * </Descriptions>
 * ```
 */
const DescriptionsComponent = forwardRef<HTMLDivElement, DescriptionsProps>(
  (
    {
      title,
      extra,
      bordered = false,
      column = { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 },
      size = 'default',
      layout = 'horizontal',
      colon = true,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    // Parse column prop into responsive object
    const columnConfig = useMemo(() => {
      if (typeof column === 'number') {
        return { xs: 1, sm: column, md: column, lg: column, xl: column, xxl: column };
      }
      return { xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3, ...column };
    }, [column]);

    // Group items into rows based on spans
    const itemsWithRows = useMemo(() => {
      const items = Children.toArray(children).filter((child): child is React.ReactElement<DescriptionItemProps> =>
        React.isValidElement(child),
      );

      const rows: Array<{ items: React.ReactElement<DescriptionItemProps>[]; totalSpan: number }> = [];
      let currentRow: React.ReactElement<DescriptionItemProps>[] = [];
      let currentSpan = 0;
      const maxColumns = Math.max(...Object.values(columnConfig));

      items.forEach((item) => {
        const span = item.props.span || 1;

        if (currentSpan + span > maxColumns && currentRow.length > 0) {
          rows.push({ items: currentRow, totalSpan: currentSpan });
          currentRow = [item];
          currentSpan = span;
        } else {
          currentRow.push(item);
          currentSpan += span;
        }
      });

      if (currentRow.length > 0) {
        rows.push({ items: currentRow, totalSpan: currentSpan });
      }

      return rows;
    }, [children, columnConfig]);

    return (
      <div
        ref={ref}
        className={cn(
          styles.descriptions,
          {
            [styles.bordered]: bordered,
            [styles.small]: size === 'small',
            [styles.middle]: size === 'middle',
            [styles.vertical]: layout === 'vertical',
            [styles.noColon]: !colon,
          },
          className,
        )}
        style={
          {
            '--descriptions-xs-columns': columnConfig.xs,
            '--descriptions-sm-columns': columnConfig.sm,
            '--descriptions-md-columns': columnConfig.md,
            '--descriptions-lg-columns': columnConfig.lg,
            '--descriptions-xl-columns': columnConfig.xl,
            '--descriptions-xxl-columns': columnConfig.xxl,
          } as React.CSSProperties
        }
        {...props}
      >
        {(title || extra) && (
          <div className={styles.header} data-testid="descriptions-header">
            {title && (
              <div className={styles.title} data-testid="descriptions-title">
                {title}
              </div>
            )}
            {extra && (
              <div className={styles.extra} data-testid="descriptions-extra">
                {extra}
              </div>
            )}
          </div>
        )}

        <div className={styles.view} data-testid="descriptions-view">
          {bordered ? (
            // Bordered table layout
            <table className={styles.table}>
              <tbody>
                {itemsWithRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={styles.row}>
                    {row.items.map((item, itemIndex) => {
                      const span = item.props.span || 1;
                      return (
                        <React.Fragment key={itemIndex}>
                          <td
                            className={cn(styles.labelCell, styles.cell)}
                            colSpan={layout === 'vertical' ? span * 2 : 1}
                          >
                            {item.props.label}
                          </td>
                          {layout === 'horizontal' && (
                            <td className={cn(styles.contentCell, styles.cell)} colSpan={span * 2 - 1}>
                              {item.props.children}
                            </td>
                          )}
                          {layout === 'vertical' && (
                            <tr>
                              <td className={cn(styles.contentCell, styles.cell)} colSpan={span * 2}>
                                {item.props.children}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Borderless grid layout
            <div className={styles.content}>
              {itemsWithRows.map((row, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                  {row.items.map((item, itemIndex) => {
                    const span = item.props.span || 1;
                    return (
                      <div
                        key={itemIndex}
                        className={styles.item}
                        style={{ '--item-span': span } as React.CSSProperties}
                      >
                        <div className={styles.label}>{item.props.label}</div>
                        <div className={styles.content}>{item.props.children}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

/**
 * Compound component type for Descriptions with Item sub-component
 */
export interface DescriptionsType extends React.ForwardRefExoticComponent<
  DescriptionsProps & React.RefAttributes<HTMLDivElement>
> {
  /**
   * Description Item sub-component
   */
  Item: typeof DescriptionItem;
}

/**
 * Export compound component
 */
export const Descriptions = DescriptionsComponent as DescriptionsType;
Descriptions.Item = DescriptionItem;
