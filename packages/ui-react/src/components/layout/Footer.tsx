/**
 * Layout Footer Component
 */

import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import styles from './Layout.module.css';

export interface FooterProps {
  /**
   * Footer content
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
 * Layout Footer
 *
 * Footer section with semantic HTML and ARIA role
 */
export function Footer({ children, className, style }: FooterProps) {
  return (
    <footer className={cn(styles.footer, className)} style={style} role="contentinfo">
      {children}
    </footer>
  );
}

Footer.displayName = 'Layout.Footer';
