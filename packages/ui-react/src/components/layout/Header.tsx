/**
 * Layout Header Component
 */

import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Layout.module.css';

export interface HeaderProps {
  /**
   * Header content
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
 * Layout Header
 *
 * Header section with semantic HTML and ARIA role
 */
export function Header({ children, className, style }: HeaderProps) {
  return (
    <header className={cn(styles.header, className)} style={style} role="banner">
      {children}
    </header>
  );
}

Header.displayName = 'Layout.Header';
