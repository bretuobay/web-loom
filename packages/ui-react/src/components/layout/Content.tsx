/**
 * Layout Content Component
 */

import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Layout.module.css';

export interface ContentProps {
  /**
   * Content children
   */
  children?: ReactNode;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Custom style
   */
  style?: CSSProperties;
}

/**
 * Layout Content
 *
 * Main content area with semantic HTML and ARIA role
 */
export function Content({ children, className, style }: ContentProps) {
  return (
    <main className={cn(styles.content, className)} style={style} role="main">
      {children}
    </main>
  );
}
