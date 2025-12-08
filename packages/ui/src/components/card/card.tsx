import type { AnchorHTMLAttributes, HTMLAttributeAnchorTarget, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import '../../styles/design-system.css';
import './card.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  href?: string;
  rel?: string;
  target?: HTMLAttributeAnchorTarget;
}

const renderCardContent = ({
  title,
  badge,
  description,
  children,
  footer,
}: Pick<CardProps, 'title' | 'badge' | 'description' | 'children' | 'footer'>) => (
  <>
    {badge ? <span className="loom-card-badge">{badge}</span> : null}
    <header>
      <h3 className="loom-card-title">{title}</h3>
    </header>
    {description || children ? (
      <p className="loom-card-description">{description ?? children}</p>
    ) : null}
    {footer ? <div className="loom-card-footer">{footer}</div> : null}
  </>
);

export function Card({
  className,
  title,
  description,
  children,
  badge,
  footer,
  href,
  rel,
  target,
  ...rest
}: CardProps) {
  if (href) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        className={cn('loom-card', className)}
        href={href}
        rel={rel ?? 'noreferrer noopener'}
        target={target ?? '_blank'}
        {...anchorProps}
      >
        {renderCardContent({ title, badge, description, children, footer })}
      </a>
    );
  }

  return (
    <article className={cn('loom-card', className)} {...rest}>
      {renderCardContent({ title, badge, description, children, footer })}
    </article>
  );
}
