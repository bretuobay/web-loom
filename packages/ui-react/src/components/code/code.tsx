import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import '../../styles/design-system.css';
import './code.css';

export interface CodeProps extends HTMLAttributes<HTMLElement> {
  block?: boolean;
  language?: string;
}

export function Code({ children, className, block = false, language, ...rest }: CodeProps) {
  if (block) {
    return (
      <pre className={cn('loom-code-block', className)} data-language={language} {...rest}>
        <code>{children}</code>
      </pre>
    );
  }

  return (
    <code className={cn('loom-code-inline', className)} {...rest}>
      {children}
    </code>
  );
}
